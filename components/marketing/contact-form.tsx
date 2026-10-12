"use client";

import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/client-api";
import { publicContactSchema, type PublicContactInput } from "@/lib/validators/public";

export function ContactForm() {
  const router = useRouter();
  const form = useForm<PublicContactInput>({
    resolver: zodResolver(publicContactSchema) as Resolver<PublicContactInput>,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(values: PublicContactInput) {
    const result = await apiRequest("/api/public/contact", { method: "POST", body: values });
    if (!result.ok) {
      toast.error(result.error ?? "Could not send message");
      return;
    }
    toast.success("Message sent — we'll get back to you soon.");
    form.reset();
    router.refresh();
  }

  return (
    <Form form={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="message"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Message</FormLabel>
            <FormControl>
              <Textarea rows={5} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Sending…" : "Send message"}
      </Button>
    </Form>
  );
}
