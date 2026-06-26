"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createCategory } from "@/actions/admin";

export function CreateCategoryForm() {
  const formRef = useRef<HTMLFormElement>(null);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const form = formRef.current;
    if (!form) return;
    const slugInput = form.elements.namedItem("slug") as HTMLInputElement;
    if (slugInput && !slugInput.dataset.touched) {
      slugInput.value = e.target.value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    }
  }

  async function handleSubmit(formData: FormData) {
    await createCategory(formData);
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid grid-cols-3 gap-3 items-end">
      <Input
        label="Name"
        name="name"
        placeholder="Research Papers"
        required
        onChange={handleNameChange}
      />
      <Input
        label="Slug"
        name="slug"
        placeholder="research-papers"
        required
        onInput={(e) => {
          (e.currentTarget as HTMLInputElement).dataset.touched = "1";
        }}
      />
      <Input label="Description (optional)" name="description" placeholder="…" />
      <div className="col-span-3 flex justify-end">
        <Button type="submit" size="sm">
          Create Category
        </Button>
      </div>
    </form>
  );
}
