"use client";

import Image from "next/image";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { DataTableColumnHeader } from "@/components/admin/data-table";
import { MoneyDisplay } from "@/components/admin/MoneyDisplay";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { MockOrder, OrderListItemPreview, OrderTabKey } from "@/types/admin-orders";

export type { MockOrder, OrderListItemPreview, OrderTabKey };

type OrderColumnsOptions = {
  onMarkPaymentPaid?: (order: MockOrder) => void;
  onMoveToTrash?: (order: MockOrder) => void;
  onRestoreFromTrash?: (order: MockOrder) => void;
  onPermanentlyDelete?: (order: MockOrder) => void;
  updatingOrderId?: string;
  trashingOrderId?: string;
  restoringOrderId?: string;
  deletingOrderId?: string;
  isTrashView?: boolean;
  permissions?: {
    canView?: boolean;
    canUpdate?: boolean;
    canManage?: boolean;
  };
};

function ItemsPreview({ items, totalQuantity }: { items: OrderListItemPreview[]; totalQuantity: number }) {
  const t = useTranslations("legacy-admin.ordersTable");

  return (
    <div className="flex min-w-[170px] items-center gap-3">
      <div className="flex -space-x-2">
        {items.slice(0, 3).map((item) => (
          <span key={item.id} className="relative inline-block size-9 overflow-hidden rounded-lg border-2 border-white bg-slate-100 shadow-sm">
            <Image src={item.image} alt={item.title} fill sizes="36px" className="object-cover" />
          </span>
        ))}
      </div>
      <div className="min-w-0">
        <div className="max-w-[150px] truncate text-xs font-bold text-slate-700">{items[0]?.title ?? t("cells.noItems")}</div>
        <div className="text-xs font-semibold text-slate-400">{t("cells.pcs", { count: totalQuantity })}</div>
      </div>
    </div>
  );
}

function QuantityCell({ itemCount, totalQuantity }: { itemCount: number; totalQuantity: number }) {
  const t = useTranslations("legacy-admin.ordersTable");

  return (
    <div className="tabular-nums">
      <div className="font-black text-slate-950">{itemCount}</div>
      <div className="text-xs font-semibold text-slate-400">{t("cells.pcs", { count: totalQuantity })}</div>
    </div>
  );
}

export function useOrderColumns({
  onMarkPaymentPaid,
  onMoveToTrash,
  onRestoreFromTrash,
  onPermanentlyDelete,
  updatingOrderId,
  trashingOrderId,
  restoringOrderId,
  deletingOrderId,
  isTrashView,
  permissions
}: OrderColumnsOptions = {}): ColumnDef<MockOrder>[] {
  const t = useTranslations("legacy-admin.ordersTable");
  const commonT = useTranslations("common.dataTable");
  const canView = permissions?.canView ?? true;
  const canUpdate = permissions?.canUpdate ?? true;
  const canManage = permissions?.canManage ?? true;

  return [
  {
    accessorKey: "orderNo",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.orderNo")} />,
    cell: ({ row }) => (
      <Link href={`/admin/orders/${row.original.id}`} className="font-black text-[#0c8fbd] hover:text-[#ff1d5e]">
        {row.original.orderNo}
      </Link>
    ),
    meta: { label: t("columns.orderNo") }
  },
  {
    accessorKey: "userEmail",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.user")} />,
    cell: ({ row }) => <span className="font-semibold text-slate-700">{row.original.userEmail}</span>,
    meta: { label: t("columns.user") }
  },
  {
    accessorKey: "orderSource",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.source")} />,
    cell: ({ row }) => <StatusBadge status={row.original.orderSource} />,
    filterFn: (row, id, value) => value === row.getValue(id),
    meta: { label: t("columns.source") }
  },
  {
    accessorKey: "itemsPreview",
    header: () => <div className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">{t("columns.items")}</div>,
    cell: ({ row }) => <ItemsPreview items={row.original.itemsPreview} totalQuantity={row.original.totalQuantity} />,
    enableSorting: false,
    enableGlobalFilter: false,
    meta: { label: t("columns.items") }
  },
  {
    accessorKey: "itemCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.qty")} />,
    cell: ({ row }) => <QuantityCell itemCount={row.original.itemCount} totalQuantity={row.original.totalQuantity} />,
    meta: { label: t("columns.qty") }
  },
  {
    accessorKey: "destinationCountry",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.country")} />,
    cell: ({ row }) => <span className="font-semibold text-slate-700">{row.original.destinationCountry}</span>,
    filterFn: (row, id, value) => value === row.getValue(id),
    meta: { label: t("columns.country") }
  },
  {
    accessorKey: "totalUsd",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.amount")} />,
    cell: ({ row }) => <MoneyDisplay amount={row.original.totalUsd} currency="USD" secondaryAmount={row.original.subtotalCny} secondaryCurrency="CNY" />,
    meta: { label: t("columns.amount") }
  },
  {
    accessorKey: "paidUsd",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.paid")} />,
    cell: ({ row }) => <MoneyDisplay amount={row.original.paidUsd} currency="USD" className="[&>span:first-child]:text-emerald-700" />,
    meta: { label: t("columns.paid") }
  },
  {
    accessorKey: "unpaidUsd",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.due")} />,
    cell: ({ row }) => <MoneyDisplay amount={row.original.unpaidUsd} currency="USD" className="[&>span:first-child]:text-amber-700" />,
    meta: { label: t("columns.due") }
  },
  {
    accessorKey: "paymentStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.payment")} />,
    cell: ({ row }) => <StatusBadge status={row.original.paymentStatus} kind="payment" />,
    filterFn: (row, id, value) => value === row.getValue(id),
    meta: { label: t("columns.payment") }
  },
  {
    accessorKey: "purchaseStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.purchase")} />,
    cell: ({ row }) => <StatusBadge status={row.original.purchaseStatus} kind="purchase" />,
    filterFn: (row, id, value) => value === row.getValue(id),
    meta: { label: t("columns.purchase") }
  },
  {
    accessorKey: "warehouseStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.warehouse")} />,
    cell: ({ row }) => <StatusBadge status={row.original.warehouseStatus} kind="warehouse" />,
    filterFn: (row, id, value) => value === row.getValue(id),
    meta: { label: t("columns.warehouse") }
  },
  {
    accessorKey: "packageStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.package")} />,
    cell: ({ row }) => <StatusBadge status={row.original.packageStatus} kind="package" />,
    filterFn: (row, id, value) => value === row.getValue(id),
    meta: { label: t("columns.package") }
  },
  {
    accessorKey: "shippingStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.shipping")} />,
    cell: ({ row }) => <StatusBadge status={row.original.shippingStatus} kind="shipping" />,
    filterFn: (row, id, value) => value === row.getValue(id),
    meta: { label: t("columns.shipping") }
  },
  {
    accessorKey: "riskStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.risk")} />,
    cell: ({ row }) => <StatusBadge status={row.original.riskStatus} kind="risk" />,
    filterFn: (row, id, value) => value === row.getValue(id),
    meta: { label: t("columns.risk") }
  },
  {
    accessorKey: "assignee",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.assignee")} />,
    cell: ({ row }) => <span className="font-semibold text-slate-700">{row.original.assignee || t("cells.unassigned")}</span>,
    filterFn: (row, id, value) => value === row.getValue(id),
    meta: { label: t("columns.assignee") }
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.updated")} />,
    cell: ({ row }) => <span className="text-sm font-semibold text-slate-500">{row.original.updatedAt}</span>,
    meta: { label: t("columns.updated") }
  },
  {
    id: "actions",
    header: () => <span className="sr-only">{t("columns.actions")}</span>,
    cell: ({ row }) => {
      const order = row.original;
      const isUpdating = updatingOrderId === order.id;
      const isTrashing = trashingOrderId === order.id;
      const isRestoring = restoringOrderId === order.id;
      const isDeleting = deletingOrderId === order.id;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<button type="button" />} className="inline-flex size-8 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" aria-label={commonT("openRowActions")}>
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {canView ? <DropdownMenuItem render={<Link href={`/admin/orders/${order.id}`} />}>{t("rowActions.openDetails")}</DropdownMenuItem> : null}
            {canUpdate ? <DropdownMenuItem render={<Link href={`/admin/orders/${order.id}#workflow`} />}>{t("rowActions.jumpToEdit")}</DropdownMenuItem> : null}
            {canUpdate && !isTrashView ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={order.paymentStatus === "paid" || isUpdating}
                  onClick={() => onMarkPaymentPaid?.(order)}
                >
                  {isUpdating ? t("rowActions.updating") : t("rowActions.markPaymentPaid")}
                </DropdownMenuItem>
              </>
            ) : null}
            {canManage ? (
              <>
                <DropdownMenuSeparator />
                {isTrashView ? (
                  <>
                    <DropdownMenuItem
                      disabled={isRestoring || isDeleting}
                      onClick={() => onRestoreFromTrash?.(order)}
                    >
                      {isRestoring ? t("rowActions.restoring") : t("rowActions.restore")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={isDeleting || isRestoring}
                      onClick={() => onPermanentlyDelete?.(order)}
                    >
                      {isDeleting ? t("rowActions.deleting") : t("rowActions.permanentlyDelete")}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isTrashing}
                    onClick={() => onMoveToTrash?.(order)}
                  >
                    {isTrashing ? t("rowActions.moving") : t("rowActions.moveToTrash")}
                  </DropdownMenuItem>
                )}
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableHiding: false,
    meta: { label: t("columns.actions") }
  }
  ];
}
