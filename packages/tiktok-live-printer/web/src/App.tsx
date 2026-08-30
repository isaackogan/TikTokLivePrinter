import { ConnectionPane } from "@/components/ConnectionPane";
import { Header } from "@/components/Header";
import { PrinterPane } from "@/components/PrinterPane";
import { RunPane } from "@/components/RunPane";
import { TriggerList } from "@/components/TriggerList";

export default function App() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-6">
      <Header />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="grid content-start gap-6">
          <ConnectionPane />
          <PrinterPane />
          <RunPane />
        </div>
        <TriggerList />
      </div>
    </main>
  );
}
