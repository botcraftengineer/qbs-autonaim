"use client";

import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@qbs-autonaim/ui";
import { Check, Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { FormValues } from "./types";
import { gigTypeOptions } from "./types";

interface GigFormProps {
  form: UseFormReturn<FormValues>;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  isCreating: boolean;
}

export function GigForm({
  form,
  onSubmit,
  onCancel,
  isCreating,
}: GigFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название *</FormLabel>
              <FormControl>
                <Input placeholder="Название задания…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {gigTypeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.emoji} {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Описание проекта…"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requiredSkills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Навыки</FormLabel>
              <FormControl>
                <Input placeholder="React, TypeScript, Figma…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="budgetMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Бюджет от</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="50000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="budgetMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Бюджет до</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="100000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="estimatedDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Сроки</FormLabel>
              <FormControl>
                <Input placeholder="2 недели…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            Отмена
          </Button>
          <Button type="submit" className="flex-1" disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Создание…
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Создать
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
