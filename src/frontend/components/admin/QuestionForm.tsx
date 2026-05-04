import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LatexPreview } from "@/components/admin/LatexPreview";
import { uploadQuestionImage, type QuestionInsert } from "@/lib/tryout-admin-queries";
import type { Question, Subject } from "@/lib/tryout-types";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

type Props = {
  subjects: Subject[];
  initial?: Question;
  loading?: boolean;
  onSubmit: (data: QuestionInsert, mode: "save" | "save_and_new") => void;
  showSaveAndNew?: boolean;
};

const OPTIONS: Array<"A" | "B" | "C" | "D" | "E"> = ["A", "B", "C", "D", "E"];

export function QuestionForm({ subjects, initial, loading, onSubmit, showSaveAndNew }: Props) {
  const [subjectId, setSubjectId] = useState(initial?.subject_id ?? subjects[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    (initial?.difficulty as any) ?? "medium"
  );
  const [questionText, setQuestionText] = useState(initial?.question_text ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [optA, setOptA] = useState(initial?.option_a ?? "");
  const [optB, setOptB] = useState(initial?.option_b ?? "");
  const [optC, setOptC] = useState(initial?.option_c ?? "");
  const [optD, setOptD] = useState(initial?.option_d ?? "");
  const [optE, setOptE] = useState(initial?.option_e ?? "");
  const [correct, setCorrect] = useState<"A" | "B" | "C" | "D" | "E">(
    (initial?.correct_answer as any) ?? "A"
  );
  const [explanation, setExplanation] = useState(initial?.explanation ?? "");
  const [explImage, setExplImage] = useState(initial?.explanation_image_url ?? "");
  const [uploadingQ, setUploadingQ] = useState(false);
  const [uploadingE, setUploadingE] = useState(false);

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: "question" | "explanation"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Maks 5MB"); return; }
    const setUp = kind === "question" ? setUploadingQ : setUploadingE;
    setUp(true);
    try {
      const url = await uploadQuestionImage(file, kind);
      if (kind === "question") setImageUrl(url);
      else setExplImage(url);
      toast.success("Gambar diupload");
    } catch (err: any) {
      toast.error(err.message ?? "Gagal upload");
    } finally {
      setUp(false);
      e.target.value = "";
    }
  };

  const reset = () => {
    setQuestionText("");
    setImageUrl("");
    setOptA(""); setOptB(""); setOptC(""); setOptD(""); setOptE("");
    setCorrect("A");
    setExplanation("");
    setExplImage("");
  };

  const handleSubmit = (mode: "save" | "save_and_new") => {
    if (!subjectId) { toast.error("Pilih mata pelajaran"); return; }
    if (!questionText.trim()) { toast.error("Soal harus diisi"); return; }
    if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim() || !optE.trim()) {
      toast.error("Semua opsi A–E harus diisi"); return;
    }
    onSubmit(
      {
        subject_id: subjectId,
        difficulty,
        question_text: questionText.trim(),
        image_url: imageUrl || null,
        option_a: optA.trim(),
        option_b: optB.trim(),
        option_c: optC.trim(),
        option_d: optD.trim(),
        option_e: optE.trim(),
        correct_answer: correct,
        explanation: explanation.trim() || null,
        explanation_image_url: explImage || null,
      },
      mode
    );
    if (mode === "save_and_new") reset();
  };

  return (
    <div className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Mata Pelajaran *</Label>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger><SelectValue placeholder="Pilih mapel" /></SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tingkat Kesulitan</Label>
          <div className="flex gap-4">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <label key={d} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="difficulty"
                  value={d}
                  checked={difficulty === d}
                  onChange={() => setDifficulty(d)}
                  className="accent-primary"
                />
                {d === "easy" ? "Mudah" : d === "medium" ? "Sedang" : "Sulit"}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="qtext">Pertanyaan * <span className="text-xs text-muted-foreground">(LaTeX: $...$ atau $$...$$)</span></Label>
        <Textarea
          id="qtext"
          rows={5}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Tulis pertanyaan di sini..."
        />
        <LatexPreview text={questionText} />
      </div>

      <div className="space-y-2">
        <Label>Gambar Soal (opsional)</Label>
        <div className="flex items-center gap-3">
          {imageUrl && (
            <div className="relative">
              <img src={imageUrl} alt="" className="h-20 w-32 rounded border object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary">
            <Upload className="h-4 w-4" />
            {uploadingQ ? "Mengupload..." : "Upload Gambar"}
            <input type="file" accept="image/*" className="hidden" disabled={uploadingQ} onChange={(e) => handleUpload(e, "question")} />
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Opsi Jawaban * &amp; Jawaban Benar</Label>
        <div className="space-y-2">
          {OPTIONS.map((opt) => {
            const value = { A: optA, B: optB, C: optC, D: optD, E: optE }[opt];
            const setter = { A: setOptA, B: setOptB, C: setOptC, D: setOptD, E: setOptE }[opt];
            return (
              <div key={opt} className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={correct === opt}
                    onChange={() => setCorrect(opt)}
                    className="accent-primary"
                  />
                  <span className="font-semibold w-5">{opt}.</span>
                </label>
                <Input
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={`Opsi ${opt}`}
                />
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">Klik radio di sebelah huruf untuk menandai jawaban benar.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expl">Pembahasan (opsional)</Label>
        <Textarea
          id="expl"
          rows={4}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Penjelasan jawaban..."
        />
        <LatexPreview text={explanation} />
      </div>

      <div className="space-y-2">
        <Label>Gambar Pembahasan (opsional)</Label>
        <div className="flex items-center gap-3">
          {explImage && (
            <div className="relative">
              <img src={explImage} alt="" className="h-20 w-32 rounded border object-cover" />
              <button
                type="button"
                onClick={() => setExplImage("")}
                className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary">
            <Upload className="h-4 w-4" />
            {uploadingE ? "Mengupload..." : "Upload Gambar"}
            <input type="file" accept="image/*" className="hidden" disabled={uploadingE} onChange={(e) => handleUpload(e, "explanation")} />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => handleSubmit("save")} disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan"}
        </Button>
        {showSaveAndNew && (
          <Button variant="outline" onClick={() => handleSubmit("save_and_new")} disabled={loading}>
            Simpan & Tambah Lagi
          </Button>
        )}
      </div>
    </div>
  );
}
