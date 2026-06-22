"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const diyOrderSchema = z.object({
  productUrl: z.string().url("Please enter a valid product URL."),
  productName: z.string().optional(),
  productImage: z.string().optional(),
  specification: z.string().optional(),
  quantity: z.number().int().positive("Quantity must be greater than 0."),
  budget: z.number().optional(),
  remark: z.string().optional(),
  contactEmail: z.string().email("Please enter a valid email.")
});

type DiyOrderValues = z.output<typeof diyOrderSchema>;

export function DiyOrderForm() {
  const form = useForm<DiyOrderValues>({
    resolver: zodResolver(diyOrderSchema),
    defaultValues: {
      productUrl: "",
      productName: "",
      productImage: "",
      specification: "",
      quantity: 1,
      budget: undefined,
      remark: "",
      contactEmail: "dguoquan60@gmail.com"
    }
  });

  function onSubmit() {
    toast.success("DIY order submitted. We will review it shortly.");
    form.reset();
  }

  return (
    <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <CardContent className="p-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField control={form.control} name="productUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>Product URL</FormLabel>
                <FormControl><Input placeholder="https://item.taobao.com/item.htm?id=..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="productName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Product name</FormLabel>
                  <FormControl><Input placeholder="Optional product name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="productImage" render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference image URL</FormLabel>
                  <FormControl><Input placeholder="Image URL for V1.0" {...field} /></FormControl>
                  <FormDescription>File upload can be connected later.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField control={form.control} name="specification" render={({ field }) => (
                <FormItem>
                  <FormLabel>Specification</FormLabel>
                  <FormControl><Input placeholder="Color, size, model" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      value={field.value}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="budget" render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget USD</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="remark" render={({ field }) => (
              <FormItem>
                <FormLabel>Remark</FormLabel>
                <FormControl><Textarea placeholder="Tell us anything important about this purchase." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="contactEmail" render={({ field }) => (
              <FormItem>
                <FormLabel>Contact email</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full sm:w-fit">Submit DIY order</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
