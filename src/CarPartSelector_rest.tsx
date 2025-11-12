];

export interface PartDefect {
  partId: string;
  partName: string;
  defects: Defect[];
}

export function CarPartSelector() {
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [partDefects, setPartDefects] = useState<PartDefect[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [debugShow, setDebugShow] = useState(false);

  // LocalStorage縺九ｉ蠕ｩ蜈・
  React.useEffect(() => {
    const saved = localStorage.getItem('partDefects');
    if (saved) {
      try {
        setPartDefects(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load defects', e);
      }
    }
  }, []);

  // 螟画峩譎ゅ↓LocalStorage縺ｫ菫晏ｭ・
  React.useEffect(() => {
    if (partDefects.length > 0) {
      localStorage.setItem('partDefects', JSON.stringify(partDefects));
    }
  }, [partDefects]);

  const handleHotspotClick = (id: string) => {
    console.log('hotspot click', id);
    setSelectedHotspotId(id);
    setDialogOpen(true);
  };

  const handleDefectsConfirm = (defects: Defect[]) => {
    if (!selectedHotspotId) return;
    const partName = HOTSPOTS.find(h => h.id === selectedHotspotId)?.label || selectedHotspotId;
    const index = partDefects.findIndex(p => p.partId === selectedHotspotId);
    const entry: PartDefect = { partId: selectedHotspotId, partName, defects };
    if (defects.length === 0) {
      if (index !== -1) setPartDefects(partDefects.filter(p => p.partId !== selectedHotspotId));
    } else {
      if (index !== -1) { const copy = [...partDefects]; copy[index] = entry; setPartDefects(copy); }
      else setPartDefects([...partDefects, entry]);
    }
    setDialogOpen(false);
    setSelectedHotspotId(null);
  };

  const getDefectLabel = (partId: string) => {
    const d = partDefects.find(p => p.partId === partId)?.defects || [];
    return d.length ? d.slice(0,2).map(x => `${x.type}${x.level}`).join(' ') : '';
  };

  const totalDefects = partDefects.reduce((s, p) => s + p.defects.length, 0);

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>霆贋ｽ灘ｱ暮幕蝗ｳ・ｽE・ｽ繝ｩ繧､繝ｳ豐ｿ縺・・ｽE繝・・ｽ・ｽ繧ｹ繝昴ャ繝茨ｼ・/CardTitle>
          <CardDescription>繝ｩ繧､繝ｳ縺ｫ豐ｿ縺｣縺ｦ繧ｿ繝・・ｽE縺励※迹慕矛繧抵ｿｽE蜉帙＠縺ｦ縺上□縺輔＞</CardDescription>
          {totalDefects > 0 && (
            <div className="mt-3 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-700">{totalDefects} 莉ｶ縺ｮ迹慕矛・ｽE・ｽEpartDefects.length}/16邂・・ｽ・ｽ・ｽE・ｽE/span>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative bg-gradient-to-b from-slate-50 to-slate-100 rounded-lg p-4 border-2 border-slate-300">
            <div className="relative w-full aspect-[1/1.3]">
              <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <image href="/car_diagram.png" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet" style={{ pointerEvents: 'none' }} />

                {HOTSPOTS.map(h => {
                  const isHovered = hovered === h.id;
                  const hasDef = partDefects.some(p => p.partId === h.id);
                  const fill = debugShow ? (hasDef ? 'rgba(254,243,199,0.7)' : 'rgba(191,219,254,0.25)') : 'transparent';
                  const stroke = hasDef ? '#f59e0b' : isHovered ? '#60a5fa' : 'transparent';
                  return (
                    <g key={h.id}>
                      {h.points ? (
                        <polygon
                          points={h.points}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={hasDef || isHovered ? 0.6 : 0.3}
                          style={{ transition: 'all .12s', cursor: 'pointer', pointerEvents: 'visiblePainted' }}
                          onClick={() => handleHotspotClick(h.id)}
                          onTouchStart={() => handleHotspotClick(h.id)}
                          onMouseEnter={() => setHovered(h.id)}
                          onMouseLeave={() => setHovered(null)}
                        />
                      ) : h.d ? (
                        <path
                          d={h.d}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={hasDef || isHovered ? 0.6 : 0.3}
                          style={{ transition: 'all .12s', cursor: 'pointer', pointerEvents: 'visiblePainted' }}
                          onClick={() => handleHotspotClick(h.id)}
                          onTouchStart={() => handleHotspotClick(h.id)}
                          onMouseEnter={() => setHovered(h.id)}
                          onMouseLeave={() => setHovered(null)}
                        />
                      ) : null}

                      {(hasDef || isHovered) && h.labelPos && (
                        <text x={h.labelPos.x} y={h.labelPos.y} textAnchor="middle" dominantBaseline="middle" fontSize="3.5" fontWeight="700" fill={hasDef ? '#b91c1c' : '#1e40af'} pointerEvents="none">
                          {hasDef ? getDefectLabel(h.id) || h.label : h.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="mt-4 pt-3 border-t text-xs text-slate-600 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-500 rounded"></div>
                <span>迹慕矛縺ゅｊ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded"></div>
                <span>繝帙ヰ繝ｼ/驕ｸ謚・/span>
              </div>
              <button onClick={() => setDebugShow(s => !s)} className="ml-3 text-xs px-2 py-1 border rounded">DEBUG</button>
            </div>
          </div>

          {partDefects.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm text-slate-700">逋ｻ骭ｲ貂医∩迹慕矛</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {partDefects.map(pd => (
                  <div key={pd.partId} className="p-3 bg-white rounded-lg border hover:border-blue-300 cursor-pointer transition-colors" onClick={() => {
                    setSelectedHotspotId(pd.partId);
                    setDialogOpen(true);
                  }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm">{pd.partName}</div>
                        <div className="flex gap-1 mt-1">
                          {pd.defects.map((d, i) => <Badge key={i} variant="secondary" className="text-xs">{d.type}{d.level}</Badge>)}
                        </div>
                      </div>
                      <Badge className="bg-orange-500">{pd.defects.length}莉ｶ</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button onClick={() => setScoreDialogOpen(true)} className="w-full" size="lg">
            <Calculator className="w-4 h-4 mr-2" /> 隧穂ｾ｡轤ｹ繧堤ｮ暦ｿｽE
          </Button>
        </CardContent>
      </Card>

      {selectedHotspotId && (
        <DefectInputDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          partName={HOTSPOTS.find(h => h.id === selectedHotspotId)?.label || selectedHotspotId}
          existingDefects={partDefects.find(p => p.partId === selectedHotspotId)?.defects || []}
          onConfirm={handleDefectsConfirm}
        />
      )}

      <EvaluationScoreDialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen} partDefects={partDefects} />
    </div>
  );
}

