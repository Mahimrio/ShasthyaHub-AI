'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Pill,
  Eye,
  AlertTriangle,
  Users,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { RELATIONS_MAP, getRelationLabel } from '@/lib/family/relations'
import type { FamilyTreeNode } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface FamilyTreeProps {
  treeData: {
    self: FamilyTreeNode
    allNodes: FamilyTreeNode[]
    otherNodes: FamilyTreeNode[]
    generations: Record<string, FamilyTreeNode[]>
    totalMembers: number
  }
  onSelectMember: (memberId: string) => void
  onAddMember: () => void
}

export function FamilyTree({ treeData, onSelectMember, onAddMember }: FamilyTreeProps) {
  const { lang } = useLanguage()
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const { self, generations, otherNodes } = treeData

  const hasRelatives = otherNodes && otherNodes.length > 0

  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.4, z + 0.1))
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.7, z - 0.1))
  const handleResetZoom = () => setZoomLevel(1)

  // Sort tiers for structured rendering:
  // -2: grandparents
  // -1: parents
  //  0: peers (self + spouse + siblings)
  //  1: children
  //  2: grandchildren
  const grandparents = generations.grandparents || []
  const parents = generations.parents || []
  const peers = (generations.peers || []).filter((n) => !n.isCurrentUser)
  const children = generations.children || []
  const grandchildren = generations.grandchildren || []

  return (
    <div className="relative w-full rounded-3xl border border-gray-100 dark:border-gray-800 bg-gradient-to-b from-white via-sky-50/20 to-gray-50/50 dark:from-gray-900 dark:via-sky-950/10 dark:to-gray-950 shadow-sm overflow-hidden min-h-[560px] flex flex-col">
      {/* Background visual grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c708_1px,transparent_1px),linear-gradient(to_bottom,#0284c708_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

      {/* Top Header & Interactive Floating Controls */}
      <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-gray-100/80 dark:border-gray-800/80 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 dark:bg-sky-400/15 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>{lang === 'bn' ? 'ইন্টারেক্টিভ ফ্যামিলি ট্রি' : 'Interactive Family Tree'}</span>
              <span className="text-[10px] font-medium bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full">
                {treeData.totalMembers} {lang === 'bn' ? 'জন সদস্য' : 'Members'}
              </span>
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {lang === 'bn'
                ? 'পিতামাতা ও স্বজনদের কার্ডে ক্লিক করে স্বাস্থ্য রেকর্ড ও ওষুধের রুটিন দেখুন'
                : 'Click any member to monitor medication schedules & health reports'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-0.5 shadow-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="h-7 w-7 p-0 rounded-lg text-gray-500 hover:text-gray-900"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] font-mono font-bold px-1.5 text-gray-400">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="h-7 w-7 p-0 rounded-lg text-gray-500 hover:text-gray-900"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              className="h-7 w-7 p-0 rounded-lg text-gray-500 hover:text-gray-900"
              title="Reset Zoom"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>

          <Button
            size="sm"
            onClick={onAddMember}
            className="h-8 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-xs font-bold shadow-xs px-3"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>{lang === 'bn' ? 'সদস্য যুক্ত করুন' : 'Add Member'}</span>
          </Button>
        </div>
      </div>

      {/* Main Tree Visual Canvas */}
      <div
        ref={containerRef}
        className="flex-1 p-4 sm:p-8 overflow-auto flex items-center justify-center relative"
      >
        <motion.div
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex flex-col items-center gap-8 sm:gap-12 w-full max-w-4xl py-4 transition-transform duration-200"
        >
          {/* TIER -2: GRANDPARENTS */}
          {grandparents.length > 0 && (
            <div className="flex flex-col items-center gap-2 w-full">
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                {lang === 'bn' ? 'দাদা-দাদী / নানা-নানী প্রজন্ম' : 'Grandparents Generation'}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {grandparents.map((node) => (
                  <TreeNodeCard
                    key={node.id}
                    node={node}
                    lang={lang}
                    onSelect={() => onSelectMember(node.userId)}
                  />
                ))}
              </div>
              <div className="w-0.5 h-6 bg-gradient-to-b from-purple-300 to-sky-300 dark:from-purple-700 dark:to-sky-700" />
            </div>
          )}

          {/* TIER -1: PARENTS & ELDERS */}
          {parents.length > 0 && (
            <div className="flex flex-col items-center gap-2 w-full">
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                {lang === 'bn' ? 'পিতামাতা ও অভিভাবক' : 'Parents & Guardians'}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {parents.map((node) => (
                  <TreeNodeCard
                    key={node.id}
                    node={node}
                    lang={lang}
                    isParent
                    onSelect={() => onSelectMember(node.userId)}
                  />
                ))}
              </div>
              <div className="w-0.5 h-6 bg-gradient-to-b from-sky-400 to-cyan-400 dark:from-sky-600 dark:to-cyan-600" />
            </div>
          )}

          {/* TIER 0: CURRENT USER ("SELF") + SPOUSE & SIBLINGS */}
          <div className="flex flex-col items-center gap-3 w-full">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-200 dark:border-cyan-800">
              {lang === 'bn' ? 'আপনার প্রজন্ম' : 'Your Generation'}
            </span>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {/* Peers (Spouse / Siblings on left/right) */}
              {peers.slice(0, Math.ceil(peers.length / 2)).map((node) => (
                <TreeNodeCard
                  key={node.id}
                  node={node}
                  lang={lang}
                  onSelect={() => onSelectMember(node.userId)}
                />
              ))}

              {/* Central User Node (Glow halo) */}
              <div className="relative group">
                <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 opacity-70 blur-md group-hover:opacity-100 transition-opacity animate-pulse" />
                <div className="relative p-4 rounded-2xl bg-white dark:bg-gray-900 border-2 border-sky-500/80 dark:border-sky-400/80 shadow-lg min-w-[200px] max-w-[240px] text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 text-white font-black text-base flex items-center justify-center mx-auto shadow-md shadow-sky-500/30">
                    {self.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 mt-2 truncate">
                    {self.name || 'You'}
                  </h4>
                  <p className="text-[11px] font-mono text-sky-600 dark:text-sky-400">
                    {self.username ? `@${self.username}` : (lang === 'bn' ? 'স্বয়ং' : 'Self')}
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    <Badge variant="default" className="text-[10px] bg-sky-500 text-white rounded-lg px-2 py-0.5">
                      {lang === 'bn' ? 'আমি (কেন্দ্রবিন্দু)' : 'You (Root)'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Other Peers on the right */}
              {peers.slice(Math.ceil(peers.length / 2)).map((node) => (
                <TreeNodeCard
                  key={node.id}
                  node={node}
                  lang={lang}
                  onSelect={() => onSelectMember(node.userId)}
                />
              ))}
            </div>
          </div>

          {/* TIER 1: CHILDREN */}
          {children.length > 0 && (
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="w-0.5 h-6 bg-gradient-to-b from-cyan-400 to-emerald-400 dark:from-cyan-600 dark:to-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                {lang === 'bn' ? 'সন্তান প্রজন্ম' : 'Children Generation'}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {children.map((node) => (
                  <TreeNodeCard
                    key={node.id}
                    node={node}
                    lang={lang}
                    onSelect={() => onSelectMember(node.userId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TIER 2: GRANDCHILDREN */}
          {grandchildren.length > 0 && (
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-400 to-teal-400 dark:from-emerald-600 dark:to-teal-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800">
                {lang === 'bn' ? 'নাতি-নাতনি প্রজন্ম' : 'Grandchildren Generation'}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {grandchildren.map((node) => (
                  <TreeNodeCard
                    key={node.id}
                    node={node}
                    lang={lang}
                    onSelect={() => onSelectMember(node.userId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state when only self node is in tree */}
          {!hasRelatives && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-3xl bg-white/80 dark:bg-gray-900/80 border border-dashed border-sky-300 dark:border-sky-800 text-center max-w-md shadow-xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {lang === 'bn' ? 'পরিবারের সদস্যদের যুক্ত করুন' : 'Grow Your Family Health Tree'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {lang === 'bn'
                  ? 'আপনার বয়োবৃদ্ধ পিতা-মাতা, স্ত্রী বা সন্তানদের যুক্ত করে তাঁদের ওষুধ খাওয়ার রুটিন ও স্বাস্থ্য পরীক্ষা ট্র্যাক করুন।'
                  : 'Add your elderly parents, spouse, or children to monitor their medication routines and diagnostic tests.'}
              </p>
              <Button
                size="sm"
                onClick={onAddMember}
                className="mt-4 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-xs font-bold shadow-md shadow-sky-500/20"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>{lang === 'bn' ? 'পিতামাতা বা স্বজনকে আমন্ত্রণ পাঠান' : 'Invite Parents or Family'}</span>
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Footer Info Strip */}
      <div className="p-3 bg-white/60 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 px-5 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {lang === 'bn' ? 'ওষুধ রুটিন সক্রিয়' : 'Active Medication Routine'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            {lang === 'bn' ? 'রিপোর্ট রেকর্ড বিদ্যমান' : 'Health Records Available'}
          </span>
        </div>
        <span>
          {lang === 'bn' ? 'স্বাস্থ্য সুরক্ষায় পুরো পরিবার এক ছাতার নিচে' : 'Family Healthcare Unified in One Hub'}
        </span>
      </div>
    </div>
  )
}

// Sub-component for individual Node Card in the Tree
function TreeNodeCard({
  node,
  lang,
  isParent,
  onSelect,
}: {
  node: FamilyTreeNode
  lang: 'en' | 'bn'
  isParent?: boolean
  onSelect: () => void
}) {
  const meta = RELATIONS_MAP[node.relation] || RELATIONS_MAP.Other
  const health = node.healthSummary

  const hasPrescriptions = health && health.totalPrescriptions > 0
  const hasEyeScans = health && health.totalEyeAnalyses > 0
  const hasUrgent = health && health.hasUrgentCondition

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`relative p-3.5 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border text-left transition-all shadow-xs hover:shadow-md cursor-pointer min-w-[170px] max-w-[210px] ${
        hasUrgent
          ? 'border-red-300 dark:border-red-800/80 ring-1 ring-red-400/40'
          : isParent
          ? 'border-sky-300 dark:border-sky-800'
          : 'border-gray-200 dark:border-gray-800 hover:border-sky-300 dark:hover:border-sky-700'
      }`}
    >
      {/* Health alert badge indicator if parent has an urgent status */}
      {hasUrgent && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-xs">
          <AlertTriangle className="h-3 w-3 animate-bounce" />
        </span>
      )}

      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 via-cyan-400 to-emerald-400 flex items-center justify-center text-white text-sm font-black shrink-0 shadow-xs">
          {node.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
            {node.name || 'Member'}
          </h4>
          <p className="text-[10px] font-mono text-gray-400 truncate">
            {node.username ? `@${node.username}` : (lang === 'bn' ? 'সদস্য' : 'Member')}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-1 flex-wrap">
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 rounded-md ${meta.badgeColor}`}>
          {getRelationLabel(node.relation, lang)}
        </Badge>

        {/* Quick Health Stats indicators */}
        <div className="flex items-center gap-1 text-[10px]">
          {hasPrescriptions && (
            <span
              title={lang === 'bn' ? `${health?.totalPrescriptions} টি প্রেসক্রিপশন` : `${health?.totalPrescriptions} Prescriptions`}
              className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md"
            >
              <Pill className="h-2.5 w-2.5" />
              <span>{health?.totalPrescriptions}</span>
            </span>
          )}
          {hasEyeScans && (
            <span
              title={lang === 'bn' ? `${health?.totalEyeAnalyses} টি চোখের টেস্ট` : `${health?.totalEyeAnalyses} Eye Scans`}
              className="flex items-center gap-0.5 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-1.5 py-0.5 rounded-md"
            >
              <Eye className="h-2.5 w-2.5" />
              <span>{health?.totalEyeAnalyses}</span>
            </span>
          )}
        </div>
      </div>
    </motion.button>
  )
}
