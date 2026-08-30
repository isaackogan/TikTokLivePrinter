import { DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type Block, type BlockType, newBlock } from "@tiktok-live-printer/config";
import { GripVertical, X } from "lucide-react";
import { BlockEditor } from "@/components/BlockEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PALETTE: { type: BlockType; label: string }[] = [
  { type: "avatar", label: "Avatar" },
  { type: "giftImage", label: "Gift image" },
  { type: "text", label: "Text" },
  { type: "line", label: "Line" },
  { type: "feed", label: "Blank lines" },
  { type: "cut", label: "Cut" },
  { type: "voice", label: "Voice" },
];

const label = (type: BlockType) => PALETTE.find((p) => p.type === type)?.label ?? type;

export function BlockList({ blocks, onChange }: { blocks: Block[]; onChange: (blocks: Block[]) => void }) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = blocks.findIndex((b) => b.id === active.id);
    const to = blocks.findIndex((b) => b.id === over.id);
    onChange(arrayMove(blocks, from, to));
  };

  return (
    <div className="grid gap-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block) => (
            <SortableBlock key={block.id} block={block} onChange={(b) => onChange(blocks.map((x) => (x.id === b.id ? b : x)))} onRemove={() => onChange(blocks.filter((x) => x.id !== block.id))} />
          ))}
        </SortableContext>
      </DndContext>
      {blocks.length === 0 && <p className="text-sm text-muted-foreground">No blocks yet. Add one below, then drag to reorder.</p>}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {PALETTE.map((p) => (
          <Button key={p.type} variant="outline" size="xs" onClick={() => onChange([...blocks, newBlock(p.type)])}>
            + {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function SortableBlock({ block, onChange, onRemove }: { block: Block; onChange: (block: Block) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex gap-2 rounded-lg border bg-card p-2 ${isDragging ? "opacity-60 shadow-md" : ""}`}>
      <button type="button" className="cursor-grab touch-none text-muted-foreground" aria-label="Drag to reorder" {...attributes} {...listeners}>
        <GripVertical className="size-4" />
      </button>
      <div className="grid flex-1 gap-2">
        <Badge variant="secondary">{label(block.type)}</Badge>
        <BlockEditor block={block} onChange={onChange} />
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remove block">
        <X />
      </Button>
    </div>
  );
}
