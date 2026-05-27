import type { BirthChart } from "@/engine/panchanga/types";
import { GrahaRow, NavamshaTableRow, DashamshaTableRow, GRAHA_ORDER } from "./kundali-ui";

interface Props {
  chart: BirthChart;
}

function TableShell({
  title,
  headers,
  footer,
  children,
}: {
  title: string;
  headers: string[];
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-theme-surface-raised rounded-xl p-6 shadow">
      <h2 className="text-theme-fg mb-4 text-base font-semibold">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-theme-border border-b">
              {headers.map((h) => (
                <th
                  key={h}
                  className={`text-theme-fg-muted pb-2 text-xs font-semibold tracking-wide uppercase ${
                    h === headers[headers.length - 1] ? "text-right" : "pr-4 text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {footer && <p className="text-theme-fg-muted mt-4 text-xs">{footer}</p>}
    </div>
  );
}

export function D1GrahaTable({ chart }: Props) {
  return (
    <TableShell
      title="Navagrahas — D1"
      headers={["Graha", "Rashi", "Nakshatra", "Longitude", "Snelheid"]}
      footer={
        <>
          R = Retrograde · Mean Node voor Rahu/Ketu ·{" "}
          <span className="text-theme-accent">Uchcha</span> = verheven ·{" "}
          <span className="text-theme-error">Neecha</span> = verzwakt ·{" "}
          <span className="text-theme-primary">Mūlatrik.</span> = moolatrikona ·{" "}
          <span className="text-theme-success">Swarashi</span> = eigen teken
        </>
      }
    >
      {GRAHA_ORDER.map((key) => (
        <GrahaRow key={key} grahaKey={key} chart={chart} />
      ))}
    </TableShell>
  );
}

export function D9GrahaTable({ chart }: Props) {
  return (
    <TableShell
      title="Navagrahas — D9 Navamsha"
      headers={["Graha", "D1 Rashi", "D9 Rashi", "D9 Graad"]}
      footer="R = Retrograde · Mean Node voor Rahu/Ketu"
    >
      {GRAHA_ORDER.map((key) => (
        <NavamshaTableRow key={key} grahaKey={key} chart={chart} />
      ))}
    </TableShell>
  );
}

export function D10GrahaTable({ chart }: Props) {
  return (
    <TableShell
      title="Navagrahas — D10 Dashamsha"
      headers={["Graha", "D1 Rashi", "D10 Rashi", "D10 Graad"]}
      footer="R = Retrograde · Mean Node voor Rahu/Ketu"
    >
      {GRAHA_ORDER.map((key) => (
        <DashamshaTableRow key={key} grahaKey={key} chart={chart} />
      ))}
    </TableShell>
  );
}
