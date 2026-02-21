"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, SearchIcon, RotateCw, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnimatePresence, motion } from "motion/react";
import { useIsAnimated } from "@/components/AnimationProvider";
import { isColorDark } from "@/utils/colorDark";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SubjectColor = {
  id?: string;
  subject: string;
  color: string;
  _tempId?: string;
};

type RowState = {
  id?: Id<"colors">;
  teacher: string;
  color: string;
  subjects: SubjectColor[];
  _editing?: boolean;
  _tempId?: string;
};

interface Props {
  classId: string | null;
}

export function TeacherColorsManager({ classId }: Props) {
  const isMobile = useIsMobile();
  const anim = useIsAnimated();
  const colorsData = useQuery(
    api.teacherColors.listTeacherColors,
    classId ? { classId: classId as Id<"classes"> } : "skip",
  );
  const saveColors = useMutation(api.teacherColors.saveTeacherColors);
  const deleteColor = useMutation(api.teacherColors.deleteTeacherColor);
  const resetColors = useMutation(api.teacherColors.resetTeacherColors);

  const [items, setItems] = useState<RowState[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftTeacher, setDraftTeacher] = useState("");
  const [draftColor, setDraftColor] = useState("#ffffff");
  const [draftSubjects, setDraftSubjects] = useState<SubjectColor[]>([]);
  const [itemToDelete, setItemToDelete] = useState<{
    id?: string;
    index: number;
  } | null>(null);
  const loading = colorsData === undefined;

  useEffect(() => {
    if (!colorsData) return;
    setItems(
      colorsData.map((r) => ({
        id: r.id as Id<"colors"> | undefined,
        teacher: r.teacher,
        color: r.color,
        subjects:
          r.subjects?.map((s) => ({
            id: s.id,
            subject: s.subject,
            color: s.color,
          })) ?? [],
        _editing: false,
      })),
    );
  }, [colorsData]);

  function addRow() {
    setDraftTeacher("");
    setDraftColor("#ffffff");
    setDraftSubjects([]);
    setEditingIndex(-1);
  }

  async function remove(id?: string, index?: number) {
    if (!id) {
      setItems((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    try {
      if (!classId) {
        toast.error("Keine Klasse gewählt");
        return;
      }
      await deleteColor({
        classId: classId as Id<"classes">,
        colorId: id as Id<"colors">,
      });
      toast.success("Gelöscht");
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (e: unknown) {
      toast.error("Löschen fehlgeschlagen", { description: String(e) });
    }
  }

  async function saveItems(itemsToSave: RowState[]) {
    if (!classId) {
      toast.error("Keine Klasse gewählt");
      return false;
    }

    try {
      await saveColors({
        classId: classId as Id<"classes">,
        items: itemsToSave.map((it) => ({
          id: it.id ? (it.id as Id<"colors">) : undefined,
          teacher: it.teacher.trim(),
          color: it.color,
          subjects: it.subjects?.map((s) => ({
            id: s.id as Id<"colors"> | undefined,
            subject: s.subject.trim(),
            color: s.color,
          })),
        })),
      });
      toast.success("Gespeichert");
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Speichern fehlgeschlagen");
      return false;
    }
  }

  async function reset() {
    if (!classId) {
      toast.error("Keine Klasse gewählt");
      return;
    }
    setSaving(true);
    try {
      await resetColors({
        classId: classId as Id<"classes">,
      });
      toast.success("Zurückgesetzt");
    } catch (e) {
      toast.error("Zurücksetzen fehlgeschlagen", {
        description: String(e),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col gap-2 flex-wrap shrink-0 sm:flex-row sm:items-center sm:justify-between">
        <Button
          size="lg"
          onClick={addRow}
          className="flex items-center gap-1"
          aria-label="Neue Lehrerkürzel-Farbe hinzufügen"
        >
          <Plus className="w-4 h-4" />
          <span>Lehrer hinzufügen</span>
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={reset}
          disabled={saving}
          className="flex items-center gap-1"
        >
          <RotateCw className="w-4 h-4" />
          <span>Alle zurücksetzen</span>
        </Button>
      </div>
      <Separator />
      {loading ? (
        <div className="flex flex-1 justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-1">
          {items.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-muted-foreground flex items-center flex-col gap-2">
                <SearchIcon className="mr-2" aria-hidden />
                Noch keine Einträge
              </div>
            </div>
          ) : (
            <div className="space-y-2 flex flex-1 flex-col w-full">
              <AnimatePresence>
                {items.map((item, idx) => {
                  return (
                    <motion.div
                      key={item.id ?? item._tempId}
                      className="flex items-center gap-3 rounded-lg border bg-card/40 px-3 py-2"
                      layout={anim}
                      initial={anim ? { opacity: 0, y: 16 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        anim ? { opacity: 0, x: -20, scale: 0.95 } : undefined
                      }
                      transition={
                        anim
                          ? {
                              duration: 0.3,
                              ease: "easeOut",
                              delay: idx * 0.04,
                            }
                          : { duration: 0 }
                      }
                    >
                      <div
                        className="relative inline-flex h-12 w-12 items-center justify-center"
                        title="Lehrerfarbe Vorschau"
                      >
                        <span
                          className="h-10 w-10 rounded-full ring-2 ring-background flex items-center justify-center text-sm font-bold"
                          style={{
                            background: item.color,
                            color: isColorDark(item.color) ? "white" : "black",
                            boxShadow:
                              "0 0 0 2px var(--background), 0 0 0 3px var(--foreground)",
                          }}
                        >
                          {item.subjects && item.subjects.length > 0
                            ? item.subjects.length
                            : ""}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm">
                          {item.teacher || (
                            <span className="italic">(leer)</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size={isMobile ? "icon" : "sm"}
                          variant="outline"
                          className="flex items-center gap-1"
                          onClick={() => {
                            setEditingIndex(idx);
                            setDraftTeacher(item.teacher);
                            setDraftColor(item.color);
                            setDraftSubjects(item.subjects ?? []);
                          }}
                        >
                          <PencilLine className="w-4 h-4" />
                          <span className="hidden md:inline">Bearbeiten</span>
                        </Button>
                        <Button
                          size={isMobile ? "icon" : "sm"}
                          variant="destructive"
                          className="flex items-center gap-1"
                          onClick={() =>
                            setItemToDelete({ id: item.id, index: idx })
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden md:inline">Löschen</span>
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={editingIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingIndex(null);
          }
        }}
      >
        <DialogContent className="max-h-[95dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Lehrerfarbe bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-6 min-h-0">
            <div className="flex flex-col gap-2 shrink-0">
              <label className="text-sm font-medium">Lehrerkürzel</label>
              <div className="flex items-center gap-4">
                <label className="relative inline-flex h-10 w-10 items-center justify-center">
                  <input
                    type="color"
                    defaultValue={draftColor}
                    onBlur={(e) => setDraftColor(e.target.value)}
                    aria-label="Farbe auswählen"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    tabIndex={-1}
                  />
                  <span
                    className="h-8 w-8 rounded-full ring-2 ring-background"
                    style={{
                      background: draftColor,
                      boxShadow:
                        "0 0 0 2px var(--background), 0 0 0 3px var(--foreground)",
                    }}
                  />
                </label>
                <Input
                  value={draftTeacher}
                  onChange={(e) => setDraftTeacher(e.target.value)}
                  placeholder="Kürzel"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-3 flex flex-col min-h-0">
              <div className="flex items-center justify-between shrink-0">
                <span className="text-sm font-medium">Fächerfarben</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={draftSubjects.some((s) => !s.subject.trim())}
                  onClick={() =>
                    setDraftSubjects((prev) => [
                      {
                        id: undefined,
                        subject: "",
                        color: draftColor,
                        _tempId: crypto.randomUUID(),
                      },
                      ...prev,
                    ])
                  }
                >
                  <Plus className="w-4 h-4 mr-1" /> Fach hinzufügen
                </Button>
              </div>

              {draftSubjects.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 min-h-0">
                  {draftSubjects.map((subjectRow, index) => (
                    <div
                      key={subjectRow.id ?? subjectRow._tempId}
                      className="flex items-center gap-3"
                    >
                      <label className="relative inline-flex h-10 w-10 items-center justify-center">
                        <input
                          type="color"
                          defaultValue={subjectRow.color}
                          onBlur={(e) => {
                            const value = e.target.value;
                            setDraftSubjects((prev) =>
                              prev.map((s, i) =>
                                i === index ? { ...s, color: value } : s,
                              ),
                            );
                          }}
                          aria-label="Fachfarbe auswählen"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          tabIndex={-1}
                        />
                        <span
                          className="h-8 w-8 rounded-full ring-2 ring-background"
                          style={{
                            background: subjectRow.color,
                            boxShadow:
                              "0 0 0 2px var(--background), 0 0 0 3px var(--foreground)",
                          }}
                        />
                      </label>
                      <Input
                        value={subjectRow.subject}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDraftSubjects((prev) =>
                            prev.map((s, i) =>
                              i === index ? { ...s, subject: value } : s,
                            ),
                          );
                        }}
                        placeholder="Fachname"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setDraftSubjects((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                        aria-label="Fachfarbe entfernen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={() => setEditingIndex(null)}>
              Abbrechen
            </Button>
            <Button
              onClick={async () => {
                if (editingIndex === null) return;

                const trimmedTeacher = draftTeacher.trim();
                const trimmedSubjects = draftSubjects.map((s) => ({
                  ...s,
                  subject: s.subject.trim(),
                }));

                let newItems: RowState[];

                if (editingIndex === -1) {
                  // Create new item
                  const newItem: RowState = {
                    teacher: trimmedTeacher,
                    color: draftColor,
                    subjects: trimmedSubjects,
                    _editing: false,
                    _tempId: crypto.randomUUID(),
                  };
                  newItems = [...items, newItem];
                } else {
                  // Update existing
                  const idx = editingIndex;
                  const updatedItem = {
                    ...items[idx],
                    teacher: trimmedTeacher,
                    color: draftColor,
                    subjects: trimmedSubjects,
                  };
                  newItems = [...items];
                  newItems[idx] = updatedItem;
                }

                const success = await saveItems(newItems);
                if (success) {
                  setItems(newItems);
                  setEditingIndex(null);
                }
              }}
              disabled={
                !draftTeacher.trim() ||
                draftSubjects.some((s) => !s.subject.trim())
              }
            >
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={itemToDelete !== null}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lehrer löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du diesen Lehrer und alle zugehörigen Fachfarben wirklich
              löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDelete) {
                  void remove(itemToDelete.id, itemToDelete.index);
                  setItemToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
