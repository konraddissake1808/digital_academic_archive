"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSubject } from "@/actions/admin";

export function CreateSubjectForm() {
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
    await createSubject(formData);
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid grid-cols-3 gap-3 items-end">
      <Input label="Name" name="name" placeholder="Computer Science" required onChange={handleNameChange} />
      <Input
        label="Slug"
        name="slug"
        placeholder="computer-science"
        required
        onInput={(e) => { (e.currentTarget as HTMLInputElement).dataset.touched = "1"; }}
      />
      <Input label="Description (optional)" name="description" placeholder="…" />
      <div className="col-span-3 flex justify-end">
        <Button type="submit" size="sm">Create Subject</Button>
      </div>
    </form>
  );
}
