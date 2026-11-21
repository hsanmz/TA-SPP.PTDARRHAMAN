import type { ReactNode } from "react";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TabsBarCardProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

/** Kartu pembungkus tab berbentuk pill. Ported dari apps/ppdb components/shared/TabsBarCard. */
export default function TabsBarCard({
  value,
  defaultValue,
  onValueChange,
  children,
  className,
}: TabsBarCardProps) {
  return (
    <Card className="rounded-2xl border-slate-100 bg-white shadow-sm">
      <div className="no-scrollbar overflow-x-auto px-3.5 py-3 sm:px-5 sm:py-4">
        <Tabs value={value} defaultValue={defaultValue} onValueChange={onValueChange}>
          <TabsList
            className={cn(
              "inline-flex h-10 w-auto min-w-full whitespace-nowrap rounded-full bg-slate-100/80 p-1 sm:min-w-0 sm:max-w-lg",
              className,
            )}
          >
            {children}
          </TabsList>
        </Tabs>
      </div>
    </Card>
  );
}
