import React, { useMemo } from 'react';
import { JobPosting, LocationPing } from '../types/job';
import { toLocalMeters } from '../utils/geo';

export interface MapWorker {
  workerId: string;
  initials: string;
  name: string;
  pings: LocationPing[];
  selected: boolean;
}

interface GeofenceMapProps {
  job: JobPosting;
  workers: MapWorker[];
}

const STEPS = [25, 50, 100, 200, 250, 500, 1000, 2000, 5000];

/**
 * Site map drawn to scale in metres around the site pin (north up).
 * No map tiles: the geofence, trails and distances are what matter here,
 * and it works offline and without an API key.
 */
export const GeofenceMap: React.FC<GeofenceMapProps> = ({ job, workers }) => {
  const origin = job.site.location;
  const r = job.site.radiusMeters;

  const projected = useMemo(
    () =>
      workers.map(w => ({
        ...w,
        pts: w.pings.map(p => ({ ...toLocalMeters(origin, p.point), inside: p.insideFence })),
      })),
    [workers, origin],
  );

  const farthest = projected.reduce(
    (m, w) => w.pts.reduce((mm, p) => Math.max(mm, Math.abs(p.x), Math.abs(p.y)), m),
    0,
  );
  const half = Math.max(r * 1.6, Math.min(farthest * 1.15, 3000), 220);
  const grid = STEPS.find(s => half / s <= 4) ?? 5000;
  const fs = half / 16;
  const marker = half * 0.045;

  const gridLines: number[] = [];
  for (let v = -Math.floor(half / grid) * grid; v <= half; v += grid) gridLines.push(v);

  return (
    <div className="relative">
      <svg
        viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`}
        className="w-full aspect-square rounded-xl bg-slate-50 border border-slate-200"
        role="img"
        aria-label={`Map of ${job.site.name} with a ${r} metre geofence and ${workers.length} tracked workers`}
      >
        {/* grid */}
        {gridLines.map(v => (
          <g key={v}>
            <line x1={v} y1={-half} x2={v} y2={half} stroke="#e2e8f0" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <line x1={-half} y1={v} x2={half} y2={v} stroke="#e2e8f0" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          </g>
        ))}

        {/* geofence */}
        <circle cx={0} cy={0} r={r} fill="#f97316" fillOpacity={0.09} stroke="#ea580c" strokeWidth={2} strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
        <text x={0} y={-r - fs * 0.5} textAnchor="middle" fontSize={fs * 0.8} fill="#c2410c" fontWeight={600}>
          {r} m geofence
        </text>

        {/* site pin */}
        <g>
          <rect x={-marker * 0.6} y={-marker * 0.6} width={marker * 1.2} height={marker * 1.2} rx={marker * 0.2} fill="#0f172a" />
        </g>

        {/* trails and positions */}
        {projected.map(w => {
          if (!w.pts.length) return null;
          const last = w.pts[w.pts.length - 1];
          const color = last.inside ? '#059669' : '#e11d48';
          return (
            <g key={w.workerId} opacity={w.selected || !projected.some(x => x.selected) ? 1 : 0.45}>
              {w.pts.length > 1 && (
                <polyline
                  points={w.pts.map(p => `${p.x},${-p.y}`).join(' ')}
                  fill="none"
                  stroke={w.selected ? '#0f172a' : '#94a3b8'}
                  strokeWidth={w.selected ? 2 : 1.5}
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {w.pts.slice(0, -1).map((p, i) => (
                <circle key={i} cx={p.x} cy={-p.y} r={marker * 0.18} fill={p.inside ? '#10b981' : '#fb7185'} />
              ))}
              <circle cx={last.x} cy={-last.y} r={marker} fill={color} stroke="#fff" strokeWidth={2} vectorEffect="non-scaling-stroke" />
              {w.selected && (
                <circle cx={last.x} cy={-last.y} r={marker * 1.45} fill="none" stroke="#0f172a" strokeWidth={2} vectorEffect="non-scaling-stroke" />
              )}
              <text x={last.x} y={-last.y + marker * 0.36} textAnchor="middle" fontSize={marker} fill="#fff" fontWeight={700}>
                {w.initials}
              </text>
            </g>
          );
        })}

        {/* north + scale */}
        <text x={half - fs * 1.2} y={-half + fs * 1.4} fontSize={fs} fill="#64748b" fontWeight={700} textAnchor="middle">N</text>
        <line x1={half - fs * 1.2} y1={-half + fs * 1.8} x2={half - fs * 1.2} y2={-half + fs * 3.2} stroke="#64748b" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <g transform={`translate(${-half + fs}, ${half - fs})`}>
          <line x1={0} y1={0} x2={grid} y2={0} stroke="#334155" strokeWidth={3} vectorEffect="non-scaling-stroke" />
          <text x={grid / 2} y={-fs * 0.4} textAnchor="middle" fontSize={fs * 0.8} fill="#334155">
            {grid >= 1000 ? `${grid / 1000} km` : `${grid} m`}
          </text>
        </g>
      </svg>


      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-900" />Site pin</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />Inside fence</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600" />Outside fence</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 border-t-2 border-dashed border-slate-400" />Movement trail</span>
      </div>
    </div>
  );
};
