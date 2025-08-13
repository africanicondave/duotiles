// src/StatsRow.jsx
import React from "react";

/**
 * StatsRow
 * - Keeps TIME / TURNS / PERS on one row on small phones.
 * - Shrinks padding & font sizes responsively using CSS clamp().
 *
 * Props (all optional — designed to be drop-in safe):
 *   timeStr   : string like "00:42"
 *   timeMs    : number (if timeStr not provided, will be formatted from ms)
 *   turns     : number
 *   moves     : alias for turns (backward-compat)
 *   bestStr   : string like "00:35"
 *   bestMs    : number (if bestStr not provided, will be formatted from ms)
 *   hintLeft  : string under TIME (default "Ready")
 *   hintMid   : string under TURNS (default "Lower is better")
 *   hintRight : string under PERS (default "—")
 *   className : optional extra class on wrapper
 */

function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}

function formatTime(ms = 0) {
  if (ms <= 0 || Number.isNaN(ms)) return "00:00";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${pad(m)}:${pad(s)}`;
}

export default function StatsRow(props) {
  const timeStr =
    props.timeStr ?? formatTime(props.timeMs ?? 0);
  const turns =
    props.turns ?? props.moves ?? 0;
  const bestStr =
    props.bestStr ??
    (props.bestMs != null ? formatTime(props.bestMs) : "00:—");

  const hintLeft = props.hintLeft ?? "Ready";
  const hintMid = props.hintMid ?? "Lower is better";
  const hintRight = props.hintRight ?? "—";

  return (
    <div className={`stats-row ${props.className ?? ""}`}>
      <div className="stat">
        <div className="label">TIME</div>
        <div className="value">{timeStr}</div>
        <div className="hint">{hintLeft}</div>
      </div>

      <div className="stat">
        <div className="label">TURNS</div>
        <div className="value">{turns}</div>
        <div className="hint">{hintMid}</div>
      </div>

      <div className="stat">
        <div className="label">PERS</div>
        <div className="value">{bestStr}</div>
        <div className="hint">{hintRight}</div>
      </div>

      {/* Scoped styles (no extra file) */}
      <style>{`
        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .stat {
          background: #fff;
          border: 1px solid #E6E6EA;
          border-radius: 12px;
          padding: clamp(8px, 2.2vw, 12px);
          box-shadow: 0 1px 0 rgba(17,17,17,0.04);
          min-width: 0; /* prevent overflow */
        }

        .label {
          font-size: clamp(10px, 2.7vw, 12px);
          line-height: 1.1;
          font-weight: 700;
          color: #6C00FF; /* brand accent */
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .value {
          margin-top: 2px;
          font-size: clamp(16px, 5vw, 20px);
          line-height: 1;
          font-weight: 800;
          color: #111;
          letter-spacing: 0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hint {
          margin-top: 4px;
          font-size: clamp(9px, 2.4vw, 11px);
          color: #555;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Tighten spacing on very narrow phones */
        @media (max-width: 380px) {
          .stats-row { gap: 8px; }
          .stat { padding: 8px 10px; }
        }
      `}</style>
    </div>
  );
}
