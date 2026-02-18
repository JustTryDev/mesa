/**
 * shadcn/ui Form 컴포넌트
 * React Hook Form과 Zod를 통합한 폼 컴포넌트
 */
import * as React from 'react'
import {
  Controller,
  ControllerProps,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from 'react-hook-form'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

// ============================================
// Types
// ============================================

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

// ============================================
// Form 컴포넌트
// ============================================

const Form = FormProvider

// ============================================
// FormField 컴포넌트
// ============================================

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-hook-form 원본 타입 호환
  TContext = any
> extends Omit<ControllerProps<TFieldValues, TName, TContext>, 'render'> {
  render: (props: {
    field: ControllerRenderProps<TFieldValues, TName>
    fieldState: {
      error?: { message?: string }
    }
  }) => React.ReactElement
}

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-hook-form 원본 타입 호환
  TContext = any
>({
  render,
  ...props
}: FormFieldProps<TFieldValues, TName, TContext>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} render={render} />
    </FormFieldContext.Provider>
  )
}

// ============================================
// FormItem 컴포넌트
// ============================================

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn('space-y-2', className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = 'FormItem'

// ============================================
// FormLabel 컴포넌트
// ============================================

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
  const { error, formFieldId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && 'text-red-500', className)}
      htmlFor={formFieldId}
      {...props}
    />
  )
})
FormLabel.displayName = 'FormLabel'

// ============================================
// FormControl 컴포넌트
// ============================================

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => {
  const { error, formFieldId, formItemId } = useFormField()

  return (
    <div
      ref={ref}
      id={formFieldId}
      aria-describedby={
        error ? `${formFieldId}-error` : `${formFieldId}-description`
      }
      className={cn(error && 'border-red-500', props.className)}
      {...props}
    />
  )
})
FormControl.displayName = 'FormControl'

// ============================================
// FormDescription 컴포넌트
// ============================================

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formFieldId } = useFormField()

  return (
    <p
      ref={ref}
      id={`${formFieldId}-description`}
      className={cn('text-sm text-gray-500', className)}
      {...props}
    />
  )
})
FormDescription.displayName = 'FormDescription'

// ============================================
// FormMessage 컴포넌트
// ============================================

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formFieldId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={`${formFieldId}-error`}
      className={cn('text-sm font-medium text-red-500', className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = 'FormMessage'

// ============================================
// Hooks
// ============================================

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>')
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formFieldId: `${id}-form-field`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    error: fieldState.error,
  }
}

// ============================================
// Utility: Zod 스키마에서 타입 추론
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod 유틸리티 타입 호환
type inferFormType<T extends z.ZodType<any, any>> = z.infer<T>

// ============================================
// Export
// ============================================

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
export type { FormFieldProps, inferFormType }
