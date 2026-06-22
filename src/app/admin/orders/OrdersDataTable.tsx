"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { ColumnFiltersState, PaginationState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { AlertTriangle, RefreshCcw, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ExportButton } from "@/components/admin/ExportButton";
import { DataTable, type DataTableFilterableColumn } from "@/components/admin/data-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrderColumns, type MockOrder, type OrderTabKey } from "@/app/admin/orders/columns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  useBulkMoveOrdersToTrash,
  useBulkPermanentlyDeleteOrders,
  useBulkRestoreOrdersFromTrash,
  useAdminOrders,
  useMoveOrderToTrash,
  usePermanentlyDeleteOrder,
  useRestoreOrderFromTrash,
  useUpdateOrderStatus
} from "@/hooks/admin/useAdminOrders";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { hasPermission } from "@/lib/auth/permissions";
import type { ExportColumn } from "@/lib/export/types";

type OrdersDataTableProps = {
  initialData: MockOrder[];
  filterableColumns: DataTableFilterableColumn[];
  userRole: string;
  initialView?: "active" | "trash";
  initialFilters?: {
    search?: string;
    orderStatus?: OrderTabKey;
    paymentStatus?: string;
    purchaseStatus?: string;
    warehouseStatus?: string;
    packageStatus?: string;
    shippingStatus?: string;
    shippingPaymentStatus?: string;
    riskStatus?: string;
    refundStatus?: string;
    destinationCountry?: string;
    assignee?: string;
    created?: string;
    paidAt?: string;
  };
};

const orderTabKeys: OrderTabKey[] = [
  "all",
  "pending_payment",
  "paid",
  "reviewing",
  "purchasing",
  "warehouse_pending",
  "shipping_pending",
  "shipped",
  "completed",
  "cancelled",
  "refunded"
];

function buildCounts(data: MockOrder[]) {
  return orderTabKeys.reduce<Record<OrderTabKey, number>>((accumulator, key) => {
    accumulator[key] = key === "all" ? data.length : data.filter((order) => order.orderTab === key).length;
    return accumulator;
  }, {} as Record<OrderTabKey, number>);
}

type PendingDangerAction =
  | { type: "mark-paid"; order: MockOrder }
  | { type: "restore"; order: MockOrder }
  | { type: "trash"; order: MockOrder }
  | { type: "delete"; order: MockOrder }
  | { type: "bulk-trash"; orders: MockOrder[] }
  | { type: "bulk-delete"; orders: MockOrder[] }
  | null;

type ExportScope = "selected" | "all";
type ExportFormat = "csv" | "xlsx";

export function OrdersDataTable({ initialData, filterableColumns, userRole, initialView = "active", initialFilters }: OrdersDataTableProps) {
  const t = useTranslations("legacy-admin.ordersTable");
  const exportColumns = useMemo<ExportColumn<MockOrder>[]>(() => [
    { key: "orderNo", header: t("columns.orderNo") },
    { key: "userEmail", header: t("columns.user") },
    { key: "orderSource", header: t("columns.source") },
    { key: "destinationCountry", header: t("columns.country") },
    { key: "totalUsd", header: t("columns.amount"), formatter: (value, row) => `USD ${Number(value ?? 0).toFixed(2)} / CNY ${row.subtotalCny.toFixed(2)}` },
    { key: "paidUsd", header: t("columns.paid"), formatter: (value) => `USD ${Number(value ?? 0).toFixed(2)}` },
    { key: "unpaidUsd", header: t("columns.due"), formatter: (value) => `USD ${Number(value ?? 0).toFixed(2)}` },
    { key: "paymentStatus", header: t("columns.payment") },
    { key: "purchaseStatus", header: t("columns.purchase") },
    { key: "warehouseStatus", header: t("columns.warehouse") },
    { key: "packageStatus", header: t("columns.package") },
    { key: "shippingStatus", header: t("columns.shipping") },
    { key: "updatedAt", header: t("columns.updated") }
  ], [t]);
  const [view, setView] = useState<"active" | "trash">(initialView);
  const [activeTab, setActiveTab] = useState<OrderTabKey>(initialFilters?.orderStatus ?? "all");
  const [globalFilter, setGlobalFilter] = useState(initialFilters?.search ?? "");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
    const entries = [
      ["paymentStatus", initialFilters?.paymentStatus],
      ["purchaseStatus", initialFilters?.purchaseStatus],
      ["warehouseStatus", initialFilters?.warehouseStatus],
      ["packageStatus", initialFilters?.packageStatus],
      ["shippingStatus", initialFilters?.shippingStatus],
      ["riskStatus", initialFilters?.riskStatus],
      ["destinationCountry", initialFilters?.destinationCountry],
      ["assignee", initialFilters?.assignee]
    ] satisfies Array<[string, string | undefined]>;

    return entries
      .filter(([, value]) => value && value !== "all")
      .map(([id, value]) => ({ id, value: value as string }));
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedOrders, setSelectedOrders] = useState<MockOrder[]>([]);
  const [pendingDangerAction, setPendingDangerAction] = useState<PendingDangerAction>(null);
  const [isFullExporting, setIsFullExporting] = useState(false);
  const orderTabs: Array<{ key: OrderTabKey; label: string }> = orderTabKeys.map((key) => ({
    key,
    label: ({
      all: t("tabs.all"),
      pending_payment: t("tabs.pendingPayment"),
      paid: t("tabs.paid"),
      reviewing: t("tabs.reviewing"),
      purchasing: t("tabs.purchasing"),
      warehouse_pending: t("tabs.warehousePending"),
      shipping_pending: t("tabs.shippingPending"),
      shipped: t("tabs.shipped"),
      completed: t("tabs.completed"),
      cancelled: t("tabs.cancelled"),
      refunded: t("tabs.refunded")
    })[key]
  }));

  const filters = useMemo(() => {
    const columnFilterValues = Object.fromEntries(
      columnFilters.map((filter) => [filter.id, typeof filter.value === "string" ? filter.value : String(filter.value)])
    );

    return {
      search: globalFilter.trim() || undefined,
      orderStatus: activeTab === "all" ? undefined : activeTab,
      paymentStatus: columnFilterValues.paymentStatus,
      purchaseStatus: columnFilterValues.purchaseStatus,
      warehouseStatus: columnFilterValues.warehouseStatus,
      packageStatus: columnFilterValues.packageStatus,
      shippingStatus: columnFilterValues.shippingStatus,
      shippingPaymentStatus: initialFilters?.shippingPaymentStatus,
      riskStatus: columnFilterValues.riskStatus,
      refundStatus: initialFilters?.refundStatus,
      destinationCountry: columnFilterValues.destinationCountry,
      assignee: columnFilterValues.assignee,
      created: initialFilters?.created,
      paidAt: initialFilters?.paidAt,
      view
    };
  }, [activeTab, columnFilters, globalFilter, initialFilters?.created, initialFilters?.paidAt, initialFilters?.refundStatus, initialFilters?.shippingPaymentStatus, view]);
  const {
    data: queryData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useAdminOrders({
    filters: {
      ...filters
    },
    pagination: {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize
    },
    sorting
  });
  const updateOrderStatus = useUpdateOrderStatus();
  const moveOrderToTrash = useMoveOrderToTrash();
  const restoreOrderFromTrash = useRestoreOrderFromTrash();
  const permanentlyDeleteOrder = usePermanentlyDeleteOrder();
  const bulkMoveOrdersToTrash = useBulkMoveOrdersToTrash();
  const bulkRestoreOrdersFromTrash = useBulkRestoreOrdersFromTrash();
  const bulkPermanentlyDeleteOrders = useBulkPermanentlyDeleteOrders();
  const data = useMemo(
    () => queryData?.data ?? (isLoading ? [] : initialData.slice(0, pagination.pageSize)),
    [initialData, isLoading, pagination.pageSize, queryData?.data]
  );
  const counts = useMemo(() => {
    return queryData?.meta.statusCounts ?? buildCounts(initialData);
  }, [initialData, queryData]);
  const markPaymentPaid = updateOrderStatus.mutate;
  const updatingOrderId = updateOrderStatus.variables?.orderId;
  const moveToTrash = moveOrderToTrash.mutate;
  const trashingOrderId = moveOrderToTrash.variables?.orderId;
  const restoreFromTrash = restoreOrderFromTrash.mutate;
  const restoringOrderId = restoreOrderFromTrash.variables?.orderId;
  const deleteFromTrash = permanentlyDeleteOrder.mutate;
  const deletingOrderId = permanentlyDeleteOrder.variables?.orderId;
  const isSubmittingDangerAction =
    updateOrderStatus.isPending
    || restoreOrderFromTrash.isPending
    || moveOrderToTrash.isPending
    || permanentlyDeleteOrder.isPending
    || bulkMoveOrdersToTrash.isPending
    || bulkPermanentlyDeleteOrders.isPending;
  const columns = useOrderColumns({
    isTrashView: view === "trash",
    onMoveToTrash: (order) => {
      setPendingDangerAction({ type: "trash", order });
    },
    onRestoreFromTrash: (order) => {
      setPendingDangerAction({ type: "restore", order });
    },
    onPermanentlyDelete: (order) => {
      setPendingDangerAction({ type: "delete", order });
    },
    updatingOrderId,
    trashingOrderId,
    restoringOrderId,
    deletingOrderId,
    permissions: {
      canView: hasPermission(userRole, "orders.view"),
      canUpdate: hasPermission(userRole, "orders.update"),
      canManage: hasPermission(userRole, "orders.manage")
    },
    onMarkPaymentPaid: (order) => {
      setPendingDangerAction({ type: "mark-paid", order });
    }
  });

  const pendingOrder = pendingDangerAction && "order" in pendingDangerAction ? pendingDangerAction.order : null;
  const pendingOrders = pendingDangerAction && "orders" in pendingDangerAction ? pendingDangerAction.orders : [];
  const isRestoreAction = pendingDangerAction?.type === "restore";
  const isMarkPaidAction = pendingDangerAction?.type === "mark-paid";
  const isDeleteAction = pendingDangerAction?.type === "delete" || pendingDangerAction?.type === "bulk-delete";
  const isBulkDangerAction = pendingDangerAction?.type === "bulk-trash" || pendingDangerAction?.type === "bulk-delete";
  const dangerTitle = pendingDangerAction
    ? isMarkPaidAction
      ? t("danger.markPaidTitle")
      : isRestoreAction
        ? t("danger.restoreTitle")
        : isDeleteAction
          ? (isBulkDangerAction ? t("danger.deleteBulkTitle") : t("danger.deleteTitle"))
          : (isBulkDangerAction ? t("danger.trashBulkTitle") : t("danger.trashTitle"))
    : "";
  const dangerDescription = pendingDangerAction
    ? isMarkPaidAction && pendingOrder
      ? t("danger.markPaidDescription", { orderNo: pendingOrder.orderNo })
      : isRestoreAction && pendingOrder
        ? t("danger.restoreDescription", { orderNo: pendingOrder.orderNo })
        : isBulkDangerAction
          ? isDeleteAction
            ? t("danger.deleteBulkDescription", { count: pendingOrders.length })
            : t("danger.trashBulkDescription", { count: pendingOrders.length })
          : pendingOrder
            ? isDeleteAction
              ? t("danger.deleteDescription", { orderNo: pendingOrder.orderNo })
              : t("danger.trashDescription", { orderNo: pendingOrder.orderNo })
            : ""
    : "";

  const canExportOrders = hasPermission(userRole, "orders.export");
  const canManageOrders = hasPermission(userRole, "orders.manage");
  const isTrashView = view === "trash";
  const selectedCount = selectedOrders.length;
  const hasSelectedOrders = selectedCount > 0;
  const selectedOrderIds = selectedOrders.map((order) => order.id);

  const resetSelection = useCallback(() => {
    setRowSelection({});
    setSelectedOrders([]);
  }, []);

  const buildExportQuery = useCallback((scope: ExportScope, format: ExportFormat, orderIds?: string[]) => {
    const params = new URLSearchParams();

    params.set("export", format);
    params.set("scope", scope);
    params.set("view", view);

    if (filters.search) params.set("search", filters.search);
    if (filters.orderStatus) params.set("orderStatus", filters.orderStatus);
    if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
    if (filters.purchaseStatus) params.set("purchaseStatus", filters.purchaseStatus);
    if (filters.warehouseStatus) params.set("warehouseStatus", filters.warehouseStatus);
    if (filters.packageStatus) params.set("packageStatus", filters.packageStatus);
    if (filters.shippingStatus) params.set("shippingStatus", filters.shippingStatus);
    if (filters.riskStatus) params.set("riskStatus", filters.riskStatus);
    if (filters.destinationCountry) params.set("destinationCountry", filters.destinationCountry);
    if (filters.assignee) params.set("assignee", filters.assignee);

    for (const orderId of orderIds ?? []) {
      params.append("orderIds", orderId);
    }

    return params.toString();
  }, [filters, view]);

  const downloadExport = useCallback(async (scope: ExportScope, format: ExportFormat, orderIds?: string[]) => {
    const response = await fetch(`/api/admin/orders?${buildExportQuery(scope, format, orderIds)}`, {
      credentials: "same-origin"
    });

    if (!response.ok) {
      let message = t("toasts.failedExport");

      try {
        const payload = await response.json();
        if (payload && typeof payload === "object" && "message" in payload) {
          message = String((payload as { message: unknown }).message);
        }
      } catch {
        // Ignore parse errors and use the fallback message.
      }

      throw new Error(message);
    }

    const disposition = response.headers.get("content-disposition") ?? "";
    const filenameMatch = disposition.match(/filename=\"?([^\";]+)\"?/i);
    const filename = filenameMatch?.[1] ?? `orders-export.${format}`;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [buildExportQuery, t]);

  const handleSelectedExport = useCallback(async (format: ExportFormat) => {
    if (!hasSelectedOrders) {
      toast.info(t("toasts.selectOrdersFirst"));
      return;
    }

    try {
      await downloadExport("selected", format, selectedOrderIds);
      toast.success(t("toasts.exportedSelected", { count: selectedCount }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("toasts.failedExportSelected"));
    }
  }, [downloadExport, hasSelectedOrders, selectedCount, selectedOrderIds, t]);

  const handleFullExport = useCallback(async (format: ExportFormat) => {
    setIsFullExporting(true);

    try {
      await downloadExport("all", format);
      toast.success(t("toasts.exportedAll"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("toasts.failedExportAll"));
    } finally {
      setIsFullExporting(false);
    }
  }, [downloadExport, t]);

  const handleConfirmDangerAction = () => {
    if (!pendingDangerAction) return;

    if (pendingDangerAction.type === "mark-paid") {
      markPaymentPaid(
        {
          orderId: pendingDangerAction.order.id,
          field: "paymentStatus",
          status: "paid"
        },
        {
          onSuccess: () => {
            setPendingDangerAction(null);
          }
        }
      );
      return;
    }

    if (pendingDangerAction.type === "restore") {
      restoreFromTrash(
        { orderId: pendingDangerAction.order.id },
        {
          onSuccess: () => {
            setPendingDangerAction(null);
          }
        }
      );
      return;
    }

    if (pendingDangerAction.type === "bulk-delete") {
      bulkPermanentlyDeleteOrders.mutate(
        { orderIds: pendingDangerAction.orders.map((order) => order.id) },
        {
          onSuccess: () => {
            setPendingDangerAction(null);
            resetSelection();
          }
        }
      );
      return;
    }

    if (pendingDangerAction.type === "bulk-trash") {
      bulkMoveOrdersToTrash.mutate(
        { orderIds: pendingDangerAction.orders.map((order) => order.id) },
        {
          onSuccess: () => {
            setPendingDangerAction(null);
            resetSelection();
          }
        }
      );
      return;
    }

    if (pendingDangerAction.type === "delete") {
      deleteFromTrash(
        { orderId: pendingDangerAction.order.id },
        {
          onSuccess: () => {
            setPendingDangerAction(null);
          }
        }
      );
      return;
    }

    moveToTrash(
      { orderId: pendingDangerAction.order.id },
      {
        onSuccess: () => {
          setPendingDangerAction(null);
        }
      }
    );
  };

  const handleBulkRestore = () => {
    if (!hasSelectedOrders) {
      toast.info(t("toasts.selectOrdersFirst"));
      return;
    }

    bulkRestoreOrdersFromTrash.mutate(
      { orderIds: selectedOrderIds },
      {
        onSuccess: () => {
          resetSelection();
        }
      }
    );
  };

  const handleRowSelectionChange = useCallback((updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
    setRowSelection((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      const selectedIds = new Set(Object.keys(next).filter((key) => next[key]));
      setSelectedOrders(data.filter((order) => selectedIds.has(order.id)));
      return next;
    });
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={view === "active" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => {
            setView("active");
            setPagination((current) => ({ ...current, pageIndex: 0 }));
            resetSelection();
          }}
        >
          {t("toolbar.activeOrders")}
        </Button>
        <Button
          type="button"
          variant={view === "trash" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => {
            setView("trash");
            setPagination((current) => ({ ...current, pageIndex: 0 }));
            resetSelection();
          }}
        >
          {t("toolbar.trash")}
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as OrderTabKey);
          setPagination((current) => ({ ...current, pageIndex: 0 }));
          resetSelection();
        }}
      >
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_10px_28px_rgba(15,23,42,0.03)]">
          <TabsList variant="line" className="min-w-max">
            {orderTabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="h-9 rounded-xl px-3 text-xs font-black data-active:bg-[#fff1f6] data-active:text-[#ff1d5e]">
                {tab.label}
                <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-500 group-data-[variant=line]/tabs-list:data-active:bg-[#ffe1eb] group-data-[variant=line]/tabs-list:data-active:text-[#ff1d5e]">
                  {counts[tab.key]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-[0_10px_28px_rgba(15,23,42,0.03)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-bold text-slate-800">{queryData?.meta.total ?? 0}</span> {view === "trash" ? t("toolbar.trashSummary") : t("toolbar.loadedSummary")}
          {isFetching ? <span className="ml-2 font-semibold text-sky-600">{t("toolbar.refreshing")}</span> : null}
          {isError ? <span className="ml-2 font-semibold text-red-600">{error instanceof Error ? error.message : t("toolbar.failedToLoadInline")}</span> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {canExportOrders ? (
            <>
              <ExportButton
                data={selectedOrders}
                columns={exportColumns}
                filename="orders-selected"
                label={hasSelectedOrders ? t("toolbar.exportSelectedWithCount", { count: selectedCount }) : t("toolbar.exportSelected")}
                disabled={isFetching || !hasSelectedOrders}
                onExportCsv={() => {
                  void handleSelectedExport("csv");
                }}
                onExportXlsx={() => {
                  void handleSelectedExport("xlsx");
                }}
              />
              <ExportButton
                data={data}
                columns={exportColumns}
                filename="orders-full"
                label={isFullExporting ? t("toolbar.exporting") : t("toolbar.exportAll")}
                disabled={isFetching || isFullExporting}
                onExportCsv={() => {
                  void handleFullExport("csv");
                }}
                onExportXlsx={() => {
                  void handleFullExport("xlsx");
                }}
              />
            </>
          ) : null}
          <Button type="button" variant="outline" size="sm" className="rounded-full" disabled={isFetching} onClick={() => refetch()}>
            <RefreshCcw className={isFetching ? "size-4 animate-spin" : "size-4"} />
            {t("toolbar.refresh")}
          </Button>
          {view === "trash" ? (
            <Button asChild type="button" variant="ghost" size="sm" className="rounded-full">
              <Link href="/admin/orders">{t("toolbar.backToActive")}</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {canManageOrders ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.03)] sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold text-slate-600">
            {hasSelectedOrders ? t("toolbar.selectedForBulk", { count: selectedCount }) : t("toolbar.selectForBulk")}
          </div>
          <div className="flex flex-wrap gap-2">
            {isTrashView ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                disabled={!hasSelectedOrders || bulkRestoreOrdersFromTrash.isPending}
                onClick={handleBulkRestore}
              >
                  {bulkRestoreOrdersFromTrash.isPending ? t("rowActions.restoring") : t("toolbar.restoreSelected")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="rounded-full"
                disabled={!hasSelectedOrders || bulkPermanentlyDeleteOrders.isPending}
                onClick={() => setPendingDangerAction({ type: "bulk-delete", orders: selectedOrders })}
              >
                  {t("toolbar.permanentlyDeleteSelected")}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="rounded-full"
                disabled={!hasSelectedOrders || bulkMoveOrdersToTrash.isPending}
                onClick={() => setPendingDangerAction({ type: "bulk-trash", orders: selectedOrders })}
              >
                {t("toolbar.moveSelectedToTrash")}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full"
              disabled={!hasSelectedOrders}
              onClick={resetSelection}
            >
              {t("toolbar.clearSelection")}
            </Button>
          </div>
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0" />
            <div>
              <div className="font-black">{t("feedback.failedToLoadTitle")}</div>
              <p className="mt-1 font-medium">{error instanceof Error ? error.message : t("feedback.pleaseRetry")}</p>
              <Button type="button" variant="outline" size="sm" className="mt-4 rounded-full bg-white" onClick={() => refetch()}>
                {t("feedback.retry")}
              </Button>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <OrdersTableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          searchPlaceholder={t("feedback.searchPlaceholder")}
          filterableColumns={filterableColumns}
          initialPageSize={10}
          manualPagination
          manualFiltering
          manualSorting
          pageCount={queryData?.meta.pageCount ?? 1}
          totalRows={queryData?.meta.total ?? data.length}
          pagination={pagination}
          onPaginationChange={(updater) => {
            setPagination(updater);
            resetSelection();
          }}
          sorting={sorting}
          onSortingChange={setSorting}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          isLoading={isFetching}
          getRowId={(row) => row.id}
          rowSelection={rowSelection}
          onRowSelectionChange={handleRowSelectionChange}
        />
      )}

      <AlertDialog open={pendingDangerAction !== null} onOpenChange={(open) => {
        if (!open && !isSubmittingDangerAction) {
          setPendingDangerAction(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className={isDeleteAction ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}>
              <AlertTriangle />
            </AlertDialogMedia>
            <AlertDialogTitle>{dangerTitle}</AlertDialogTitle>
            <AlertDialogDescription>{dangerDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmittingDangerAction}>{t("danger.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant={isDeleteAction ? "destructive" : "default"}
              disabled={!pendingDangerAction || isSubmittingDangerAction}
              onClick={handleConfirmDangerAction}
            >
              {isSubmittingDangerAction
                ? isMarkPaidAction
                  ? t("rowActions.updating")
                  : isRestoreAction
                    ? t("rowActions.restoring")
                    : isDeleteAction
                      ? t("rowActions.deleting")
                      : t("rowActions.moving")
                : isMarkPaidAction
                  ? t("danger.confirmPaid")
                  : isRestoreAction
                    ? t("danger.restoreOrder")
                    : isDeleteAction
                      ? t("rowActions.permanentlyDelete")
                      : t("rowActions.moveToTrash")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function OrdersTableSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center">
        <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100 md:max-w-sm" />
        <div className="h-10 w-36 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-10 w-36 animate-pulse rounded-xl bg-slate-100" />
      </div>
      <Table className="min-w-max">
        <TableBody>
          {Array.from({ length: 8 }).map((_, index) => (
            <TableRow key={index} className="h-14">
              {Array.from({ length: 10 }).map((__, cellIndex) => (
                <TableCell key={cellIndex} className="px-4 py-3">
                  <div className="h-4 w-24 animate-pulse rounded-full bg-slate-100" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-between border-t border-slate-100 p-4">
        <div className="h-4 w-40 animate-pulse rounded-full bg-slate-100" />
        <div className="h-8 w-72 animate-pulse rounded-full bg-slate-100" />
      </div>
    </div>
  );
}
