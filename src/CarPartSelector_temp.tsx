import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calculator, AlertCircle } from 'lucide-react';
import { DefectInputDialog, Defect } from './DefectInputDialog';
import { EvaluationScoreDialog } from './EvaluationScoreDialog';

type Hotspot = {
  id: string;
  label: string;
  points?: string; // polygon points in viewBox (0-100)
  d?: string;      // optional path 'd'
  labelPos?: { x: number; y: number };
};

