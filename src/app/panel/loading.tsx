import { Loading } from "@/components/ui/feedback";
export default function PanelLoading() {
  return (
    <div className="panel-loading">
      <Loading label="Dein Arbeitsbereich wird vorbereitet …" />
    </div>
  );
}
