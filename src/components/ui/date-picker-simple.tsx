"use client";

import * as React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Field, FieldLabel } from "@/components/ui/field";

interface DatePickerSimpleProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    label?: string;
    placeholder?: string;
    id?: string;
    className?: string;
}

export function DatePickerSimple({
    date,
    setDate,
    label = "วันเกิด",
    placeholder = "เลือกวันที่",
    id = "date",
    className,
}: DatePickerSimpleProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Field className={cn("w-full", className)}>
            {label && (
                <FieldLabel className="text-foreground" htmlFor={id}>
                    {label}
                </FieldLabel>
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id={id}
                        className={cn(
                            "w-full justify-start text-left font-normal h-10 bg-card border-gray-300 hover:border-primary/30 transition-all",
                            !date && "text-muted-foreground",
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50 text-primary" />
                        {date ? (
                            format(date, "d MMMM yyyy", { locale: th })
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto overflow-hidden p-0 z-100"
                    align="start"
                >
                    <Calendar
                        mode="single"
                        selected={date}
                        defaultMonth={date || new Date()}
                        captionLayout="dropdown"
                        onSelect={(selectedDate) => {
                            setDate(selectedDate);
                            setOpen(false);
                        }}
                        locale={th}
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                    />
                </PopoverContent>
            </Popover>
        </Field>
    );
}
