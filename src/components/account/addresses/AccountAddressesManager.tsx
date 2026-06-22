"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit3, MapPin, Plus, ShieldCheck, Star, Trash2, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { MobileAddressesWorkspace } from "@/components/account/mobile/MobileAddressesWorkspace";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countryName, countryOptions, getStateOptions } from "@/lib/countries";
import { isShippingCountrySupported } from "@/lib/account/address-utils";
import { useMyAddresses, useRefreshMyAddresses } from "@/hooks/account/useMyAddresses";
import { cn } from "@/lib/utils";
import type { AccountAddress, AccountAddressFormValues } from "@/types/address";

const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  country: z.string().min(2, "Country is required."),
  state: z.string().min(1, "State or province is required."),
  city: z.string().min(1, "City is required."),
  address1: z.string().min(3, "Address line 1 is required."),
  address2: z.string().optional(),
  postcode: z.string().min(2, "Postcode is required."),
  phone: z.string().min(6, "Phone number is required."),
  email: z.string().email("Please enter a valid email."),
  isDefault: z.boolean()
});

type AddressFormValues = z.input<typeof addressSchema>;

const emptyAddress: AddressFormValues = {
  firstName: "",
  lastName: "",
  country: "US",
  state: "",
  city: "",
  address1: "",
  address2: "",
  postcode: "",
  phone: "",
  email: "",
  isDefault: false
};

export function AccountAddressesManager() {
  const t = useTranslations("account.addresses.page");
  const { data = [], isLoading } = useMyAddresses();

  if (isLoading) {
    return (
      <div>
        <AccountPageHeader
          title={t("title")}
          description={t("description")}
        />
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">{t("loading")}</div>
      </div>
    );
  }

  return <AddressesWorkspace initialAddresses={data} />;
}

function AddressesWorkspace({ initialAddresses }: { initialAddresses: AccountAddress[] }) {
  const pageT = useTranslations("account.addresses.page");
  const toastT = useTranslations("account.addresses.toast");
  const cardT = useTranslations("account.addresses.card");
  const [addresses, setAddresses] = React.useState<AccountAddress[]>(() => initialAddresses);
  const [editingAddress, setEditingAddress] = React.useState<AccountAddress | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const refreshAddresses = useRefreshMyAddresses();

  function openNewAddress() {
    setEditingAddress(null);
    setDialogOpen(true);
  }

  function openEditAddress(address: AccountAddress) {
    setEditingAddress(address);
    setDialogOpen(true);
  }

  async function saveAddress(values: AccountAddressFormValues) {
    const body = {
      id: editingAddress?.id ? Number(editingAddress.id) : undefined,
      label: "Shipping",
      contactName: `${values.firstName} ${values.lastName}`.trim(),
      phone: values.phone,
      country: values.country,
      state: values.state,
      city: values.city,
      postalCode: values.postcode,
      line1: values.address1,
      line2: values.address2 ?? "",
      isDefault: values.isDefault
    };

    const response = await fetch("/api/checkout/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const json = await response.json().catch(() => ({})) as { error?: string; addressId?: number };

    if (!response.ok || !json.addressId) {
      toast.error(json.error || toastT("saveFailed"));
      return;
    }

    const nextAddress: AccountAddress = {
      ...values,
      id: String(json.addressId)
    };

    setAddresses((current) => {
      const withoutCurrent = current.filter((address) => address.id !== nextAddress.id);
      const normalized = values.isDefault || !withoutCurrent.some((address) => address.isDefault)
        ? withoutCurrent.map((address) => ({ ...address, isDefault: false }))
        : withoutCurrent;
      return [nextAddress, ...normalized].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
    });

    const freshAddresses = await refreshAddresses();
    setAddresses(freshAddresses);

    toast.success(editingAddress ? toastT("updated") : toastT("added"));
    setDialogOpen(false);
  }

  async function deleteAddress(addressId: string) {
    if (addresses.length <= 1) {
      toast.error(toastT("mustKeepOne"));
      return;
    }

    const response = await fetch(`/api/checkout/address?id=${addressId}`, { method: "DELETE" });
    const json = await response.json().catch(() => ({})) as { error?: string; nextDefaultId?: number };

    if (!response.ok) {
      toast.error(json.error || toastT("deleteFailed"));
      return;
    }

    setAddresses((current) => {
      const remaining = current.filter((address) => address.id !== addressId);
      return remaining.map((address) => ({
        ...address,
        isDefault: json.nextDefaultId ? address.id === String(json.nextDefaultId) : address.isDefault
      })).sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
    });
    const freshAddresses = await refreshAddresses();
    setAddresses(freshAddresses);
    toast.success(toastT("deleted"));
  }

  async function setDefault(addressId: string) {
    const target = addresses.find((address) => address.id === addressId);
    if (!target) return;

    const body = {
      id: Number(target.id),
      label: "Shipping",
      contactName: `${target.firstName} ${target.lastName}`.trim(),
      phone: target.phone,
      country: target.country,
      state: target.state,
      city: target.city,
      postalCode: target.postcode,
      line1: target.address1,
      line2: target.address2 ?? "",
      isDefault: true
    };

    const response = await fetch("/api/checkout/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const json = await response.json().catch(() => ({})) as { error?: string };

    if (!response.ok) {
      toast.error(json.error || toastT("defaultFailed"));
      return;
    }

    setAddresses((current) => current.map((address) => ({ ...address, isDefault: address.id === addressId })).sort((a, b) => Number(b.isDefault) - Number(a.isDefault)));
    const freshAddresses = await refreshAddresses();
    setAddresses(freshAddresses);
    toast.success(toastT("defaultUpdated"));
  }

  return (
    <>
      <MobileSectionShell title={pageT("title")} description={pageT("description")} kicker={pageT("title")} className="mobile-addresses-page md:hidden" minimalHeader showBackButton>
        <section className="card-stack-section">
          <button className="cnsnap-home-mobile-more" onClick={openNewAddress}>
            <Plus size={16} />
            {pageT("addAddress")}
          </button>
        </section>
        {addresses.length ? (
          <section className="card-stack-section">
            <MobileAddressesWorkspace
              title={pageT("title")}
              description={pageT("description")}
              allLabel="All"
              defaultLabel={cardT("default")}
              supportedLabel={cardT("supported")}
              addresses={addresses.map((address) => ({
                ...address,
                supported: isShippingCountrySupported(address.country)
              }))}
              renderRow={(address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={() => openEditAddress(address)}
                  onDelete={() => deleteAddress(address.id)}
                  onSetDefault={() => setDefault(address.id)}
                  mobile
                />
              )}
            />
          </section>
        ) : (
          <section className="card-stack-section">
            <div className="mobile-cart-empty">
              <h2>{pageT("noSaved")}</h2>
              <p>{pageT("noSavedDescription")}</p>
              <button className="cnsnap-home-mobile-more" onClick={openNewAddress}>
                <Plus size={16} />
                {pageT("addAddress")}
              </button>
            </div>
          </section>
        )}
      </MobileSectionShell>

      <div className="hidden md:block">
        <AccountPageHeader
          title={pageT("title")}
          description={pageT("description")}
          action={<Button onClick={openNewAddress}><Plus />{pageT("addAddress")}</Button>}
        />

        {addresses.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={() => openEditAddress(address)}
                onDelete={() => deleteAddress(address.id)}
                onSetDefault={() => setDefault(address.id)}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-slate-200 bg-white/90">
            <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-sky-50 text-sky-600">
                <MapPin className="size-5" />
              </div>
              <h2 className="mt-4 text-base font-black text-slate-950">{pageT("noSaved")}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{pageT("noSavedDescription")}</p>
              <Button className="mt-5" onClick={openNewAddress}><Plus />{pageT("addAddress")}</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AddressDialog
        open={dialogOpen}
        address={editingAddress}
        onOpenChange={setDialogOpen}
        onSubmit={saveAddress}
      />
    </>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  mobile = false
}: {
  address: AccountAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  mobile?: boolean;
}) {
  const t = useTranslations("account.addresses.card");
  const supported = isShippingCountrySupported(address.country);

  return (
    <Card className={cn("border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]", address.isDefault ? "ring-2 ring-pink-100" : "", mobile && "mobile-account-card")}>
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-950">{address.firstName} {address.lastName}</h2>
              {address.isDefault ? <Badge variant="outline" className="border-pink-200 bg-pink-50 text-pink-700"><Star className="mr-1 size-3" />{t("default")}</Badge> : null}
              {supported ? (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700"><Truck className="mr-1 size-3" />{t("supported")}</Badge>
              ) : (
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">{t("shippingUnavailable")}</Badge>
              )}
            </div>
            <div className="mt-4 grid gap-1.5 text-sm font-medium leading-6 text-slate-600">
              <div>{address.address1}{address.address2 ? `, ${address.address2}` : ""}</div>
              <div>{address.city}, {address.state} {address.postcode}</div>
              <div>{countryName(address.country)}</div>
              <div>{address.phone}</div>
              <div className="truncate">{address.email}</div>
            </div>
            {!supported ? (
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
                {t("unsupportedWarning")}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            {!address.isDefault ? <Button variant="outline" size="sm" onClick={onSetDefault}><ShieldCheck />{t("setDefault")}</Button> : null}
            <Button variant="outline" size="sm" onClick={onEdit}><Edit3 />{t("edit")}</Button>
            <Button variant="outline" size="sm" className="text-rose-600 hover:bg-rose-50" onClick={onDelete}><Trash2 />{t("delete")}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddressDialog({
  open,
  address,
  onOpenChange,
  onSubmit
}: {
  open: boolean;
  address: AccountAddress | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AccountAddressFormValues) => void;
}) {
  const t = useTranslations("account.addresses.dialog");
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: address ?? emptyAddress
  });
  // eslint-disable-next-line react-hooks/incompatible-library -- React Hook Form watch is required for dependent country/state UI.
  const selectedCountry = form.watch("country");
  const stateOptions = getStateOptions(selectedCountry);
  const supported = isShippingCountrySupported(selectedCountry);

  React.useEffect(() => {
    form.reset(address ?? emptyAddress);
  }, [address, form, open]);

  function submit(values: AddressFormValues) {
    onSubmit(values);
  }

  return (
    <>
      <div className="hidden md:block">
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{address ? t("editTitle") : t("addTitle")}</DialogTitle>
              <DialogDescription>{t("description")}</DialogDescription>
            </DialogHeader>
            <AddressDialogForm
              form={form}
              selectedCountry={selectedCountry}
              stateOptions={stateOptions}
              supported={supported}
              t={t}
              address={address}
              onOpenChange={onOpenChange}
              onSubmit={submit}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-[28px] border-t border-[#ebe7e0] bg-[#fbfaf8] p-0" showCloseButton>
            <SheetHeader className="border-b border-[#ebe7e0] px-4 pb-3 pt-4">
              <SheetTitle>{address ? t("editTitle") : t("addTitle")}</SheetTitle>
              <SheetDescription>{t("description")}</SheetDescription>
            </SheetHeader>
            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
              <AddressDialogForm
                form={form}
                selectedCountry={selectedCountry}
                stateOptions={stateOptions}
                supported={supported}
                t={t}
                address={address}
                onOpenChange={onOpenChange}
                onSubmit={submit}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function AddressDialogForm({
  form,
  selectedCountry,
  stateOptions,
  supported,
  t,
  address,
  onOpenChange,
  onSubmit
}: {
  form: ReturnType<typeof useForm<AddressFormValues>>;
  selectedCountry: string;
  stateOptions: ReturnType<typeof getStateOptions>;
  supported: boolean;
  t: ReturnType<typeof useTranslations<"account.addresses.dialog">>;
  address: AccountAddress | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AddressFormValues) => void;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.firstName")}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.lastName")}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField control={form.control} name="country" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.country")}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("state", "");
                }}>
                  <SelectTrigger className="h-9 w-full bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {countryOptions.map((country) => (
                      <SelectItem key={country.iso2} value={country.iso2}>{country.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="state" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.state")}</FormLabel>
              <FormControl>
                {stateOptions.length ? (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 w-full bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {stateOptions.map((state) => (
                        <SelectItem key={state.code} value={state.code}>{state.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input {...field} placeholder={t("fields.statePlaceholder")} />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {!supported ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
            {t("unsupportedCountry", { country: countryName(selectedCountry) })}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField control={form.control} name="city" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.city")}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="postcode" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.postcode")}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="address1" render={({ field }) => (
          <FormItem>
            <FormLabel>{t("fields.address1")}</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="address2" render={({ field }) => (
          <FormItem>
            <FormLabel>{t("fields.address2")}</FormLabel>
            <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
            <FormDescription>{t("fields.address2Help")}</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.phone")}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.email")}</FormLabel>
              <FormControl><Input type="email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="isDefault" render={({ field }) => (
          <FormItem className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <label className="flex cursor-pointer items-start gap-3">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
              </FormControl>
              <span>
                <span className="block text-sm font-bold text-slate-800">{t("fields.isDefault")}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{t("fields.isDefaultHelp")}</span>
              </span>
            </label>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("actions.cancel")}</Button>
          <Button type="submit">{address ? t("actions.saveChanges") : t("actions.addAddress")}</Button>
        </div>
      </form>
    </Form>
  );
}
