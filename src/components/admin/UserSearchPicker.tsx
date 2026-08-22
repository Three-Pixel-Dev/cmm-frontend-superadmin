import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usersApi } from "@/lib/admin/api";
import type { ApiUser } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type UserSearchPickerProps = {
  value: string;
  selected?: ApiUser | null;
  onSelect: (user: ApiUser) => void;
  placeholder?: string;
  excludeUserIds?: string[];
};

export function UserSearchPicker({
  value,
  selected,
  onSelect,
  placeholder = "Search by name or email…",
  excludeUserIds = [],
}: UserSearchPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const usersQ = useQuery({
    queryKey: ["admin", "users", "picker", query],
    queryFn: () => usersApi.list({ search: query, limit: 50 }),
    enabled: open,
  });
  const users = (usersQ.data?.items ?? []).filter((u) => !excludeUserIds.includes(u.id));
  const match = selected ?? users.find((u) => u.id === value);
  const label = match ? `${match.name} — ${match.email}` : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select user"
          className={cn(
            "w-full justify-between font-normal",
            !label && "text-muted-foreground",
          )}
        >
          <span className="truncate">{label ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[100] w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {usersQ.isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : users.length === 0 ? (
              <CommandEmpty>No users found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => {
                      onSelect(user);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        value === user.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">
                      {user.name} — {user.email}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
