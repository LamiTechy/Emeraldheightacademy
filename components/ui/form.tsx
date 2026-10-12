"use client";

import * as React from "react";
import { Slot } from "radix-ui";
import { FormProvider } from "react-hook-form";
import {
  Controller,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { cn } from "cn";

function Form<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
  ...props
}: {
  form: UseFormReturn<TFieldValues>;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  className?: string;
} & Omit<React.ComponentProps<"form">, "className" | "onSubmit">) {
  return (
    <FormProvider {...form}>
      <form
        data-slot="form"
        className={cn(className)}
        onSubmit={onSubmit}
        noValidate
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  );
}
Form.displayName = "Form";

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}
FormField.displayName = "FormField";

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }
  if (!itemContext) {
    throw new Error("useFormField should be used within <FormItem>");
  }

  const fieldState = getFieldState(fieldContext.name);
  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
}

type FormItemContextValue = { id: string };

const FormItemContext = React.createContext<FormItemContextValue | null>(null);

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
}
FormItem.displayName = "FormItem";

function FormLabel({ className, ...props }: React.ComponentProps<"label">) {
  const { error, formItemId } = useFormField();

  return (
    <label
      data-slot="form-label"
      data-error={!!error}
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        error && "text-destructive",
        className,
      )}
      htmlFor={formItemId}
      {...props}
    />
  );
}
FormLabel.displayName = "FormLabel";

function FormControl(props: React.ComponentProps<typeof Slot.Root>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
}
FormControl.displayName = "FormControl";

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-xs", className)}
      {...props}
    />
  );
}
FormDescription.displayName = "FormDescription";

function FormMessage({ className, children, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message ?? "") : children;

  if (!body) return null;

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-xs", className)}
      {...props}
    >
      {body}
    </p>
  );
}
FormMessage.displayName = "FormMessage";

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
