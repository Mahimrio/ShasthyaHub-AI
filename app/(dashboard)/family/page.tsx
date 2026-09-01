'use client'

import { useState } from 'react'
import {
  Users,
  UserPlus,
  TreeDeciduous,
  Inbox,
  Loader2,
  Mail,
  Copy,
  Check,
  AtSign,
  Edit3,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/hooks/useAuth'
import {
  useFamilyConnections,
  useFamilyTree,
  useProfileUsername,
} from '@/hooks/useFamily'
import { FamilyTree } from '@/components/features/family/FamilyTree'
import { FamilyMemberCard } from '@/components/features/family/FamilyMemberCard'
import { InvitationCard } from '@/components/features/family/InvitationCard'
import { AddFamilyMember } from '@/components/features/family/AddFamilyMember'
import { MemberHealthPanel } from '@/components/features/family/MemberHealthPanel'
import { UpdateUsernameDialog } from '@/components/features/family/UpdateUsernameDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

export default function FamilyPage() {
  const { lang } = useLanguage()
  const { user, profile, isLoading: isAuthLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<'tree' | 'members' | 'invitations'>('tree')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [usernameModalOpen, setUsernameModalOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState(false)

  const { data: usernameData } = useProfileUsername()
  const { data: connections, isLoading: isConnsLoading, isError: isConnsError } = useFamilyConnections()
  const { data: treeData, isLoading: isTreeLoading, isError: isTreeError } = useFamilyTree()

  const currentUsername = usernameData?.username || profile?.username || null
  const userEmail = user?.email || null

  const pendingReceived = (connections || []).filter((c) => c.status === 'pending' && !c.is_requester)
  const pendingSent = (connections || []).filter((c) => c.status === 'pending' && c.is_requester)
  const acceptedMembers = (connections || []).filter((c) => c.status === 'accepted')
  const totalPending = pendingReceived.length + pendingSent.length

  const handleCopyId = () => {
    const textToCopy = userEmail || currentUsername || ''
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Consolidated Top Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
            <TreeDeciduous className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
              {lang === 'bn' ? 'পারিবারিক স্বাস্থ্য সেবা' : 'Family Health Care'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {lang === 'bn'
                ? 'পিতামাতা ও পরিবারের সদস্যদের স্বাস্থ্য ও ওষুধের রুটিন পর্যবেক্ষণ করুন'
                : 'Monitor daily medication routines & medical reports for your loved ones'}
            </p>
          </div>
        </div>

        {/* Action Controls & Family ID Quick-Share */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick ID Copy Button */}
          {userEmail && (
            <button
              type="button"
              onClick={handleCopyId}
              title={lang === 'bn' ? 'পারিবারিক সার্চ আইডি কপি করুন' : 'Click to copy Family Search ID'}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/80 px-3 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 transition-colors shadow-2xs"
            >
              <Mail className="h-3.5 w-3.5 text-sky-500" />
              <span className="truncate max-w-[130px] sm:max-w-[160px]">{userEmail}</span>
              {copiedId ? (
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              )}
            </button>
          )}

          {/* Update Username Button */}
          <Button
            variant="outline"
            onClick={() => setUsernameModalOpen(true)}
            className="rounded-2xl border-gray-200 dark:border-gray-700 text-xs font-semibold h-9 px-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <AtSign className="h-3.5 w-3.5 mr-1 text-emerald-500" />
            <span>
              {currentUsername ? `@${currentUsername}` : (lang === 'bn' ? 'ইউজারনেম' : 'Set Username')}
            </span>
            <Edit3 className="h-3 w-3 ml-1.5 text-gray-400" />
          </Button>

          {/* Add Member Button */}
          <Button
            onClick={() => setAddModalOpen(true)}
            className="rounded-2xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white text-xs font-bold h-9 px-4 shadow-sm"
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            <span>{lang === 'bn' ? 'সদস্য যোগ' : 'Add Member'}</span>
          </Button>
        </div>
      </div>

      {/* Main Tabs Container */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'tree' | 'members' | 'invitations')} className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList className="grid grid-cols-3 h-11 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-2xl w-full sm:w-auto sm:min-w-[340px]">
            <TabsTrigger value="tree" className="text-xs font-bold rounded-xl flex items-center gap-1.5">
              <TreeDeciduous className="h-3.5 w-3.5" />
              <span>{lang === 'bn' ? 'প্রজন্ম বৃক্ষ' : 'Family Tree'}</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="text-xs font-bold rounded-xl flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{lang === 'bn' ? 'সদস্য তালিকা' : 'Members'}</span>
              <span className="text-[10px] font-mono bg-white dark:bg-gray-700 px-1.5 py-0.2 rounded-full">
                {acceptedMembers.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="invitations" className="text-xs font-bold rounded-xl flex items-center gap-1.5">
              <Inbox className="h-3.5 w-3.5" />
              <span>{lang === 'bn' ? 'অনুরোধ' : 'Requests'}</span>
              {totalPending > 0 && (
                <span className="text-[10px] font-mono bg-sky-500 text-white px-1.5 py-0.2 rounded-full">
                  {totalPending}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Interactive Family Tree */}
        <TabsContent value="tree" className="space-y-4 pt-1 focus:outline-none">
          {isAuthLoading || isTreeLoading || (!treeData && !isTreeError) ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500 mb-3" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {lang === 'bn' ? 'ফ্যামিলি ট্রি প্রস্তুত হচ্ছে...' : 'Building family tree...'}
              </p>
            </div>
          ) : treeData ? (
            <FamilyTree
              treeData={treeData}
              onSelectMember={(mId) => setSelectedMemberId(mId)}
              onAddMember={() => setAddModalOpen(true)}
            />
          ) : (
            <div className="p-8 text-center text-xs text-gray-400">
              {lang === 'bn' ? 'ফ্যামিলি ট্রি লোড করা সম্ভব হয়নি' : 'Failed to load family tree'}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Connected Members List */}
        <TabsContent value="members" className="space-y-3 pt-1 focus:outline-none">
          {isAuthLoading || isConnsLoading || (!connections && !isConnsError) ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500 mb-2" />
              <p className="text-xs">{lang === 'bn' ? 'সদস্য তালিকা লোড হচ্ছে...' : 'Loading members...'}</p>
            </div>
          ) : acceptedMembers.length === 0 ? (
            <div className="p-12 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {lang === 'bn' ? 'এখনো কোনো সদস্য যুক্ত নেই' : 'No connected family members yet'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {lang === 'bn'
                  ? 'আপনার পিতা-মাতা বা স্বজনদের জিমেইল দিয়ে আমন্ত্রণ পাঠিয়ে এখানে যুক্ত করুন।'
                  : 'Search your parents or relatives by their Gmail or username to monitor their health.'}
              </p>
              <Button
                size="sm"
                onClick={() => setAddModalOpen(true)}
                className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                <span>{lang === 'bn' ? 'সদস্য আমন্ত্রণ পাঠান' : 'Send Invite'}</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {acceptedMembers.map((c) => (
                <FamilyMemberCard
                  key={c.id}
                  connection={c}
                  onViewHealth={(mId) => setSelectedMemberId(mId)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Pending Invitations */}
        <TabsContent value="invitations" className="space-y-4 pt-1 focus:outline-none">
          {/* Received Requests */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
              {lang === 'bn' ? `প্রাপ্ত আমন্ত্রণসমূহ (${pendingReceived.length})` : `Received Invitations (${pendingReceived.length})`}
            </h4>
            {pendingReceived.length === 0 ? (
              <p className="text-xs text-gray-400 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-center">
                {lang === 'bn' ? 'কোনো নতুন আমন্ত্রণ নেই' : 'No received invitations waiting for approval'}
              </p>
            ) : (
              <div className="space-y-2">
                {pendingReceived.map((c) => (
                  <InvitationCard key={c.id} connection={c} />
                ))}
              </div>
            )}
          </div>

          {/* Sent Requests */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
              {lang === 'bn' ? `প্রেরিত আমন্ত্রণসমূহ (${pendingSent.length})` : `Sent Invitations (${pendingSent.length})`}
            </h4>
            {pendingSent.length === 0 ? (
              <p className="text-xs text-gray-400 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-center">
                {lang === 'bn' ? 'কোনো অপেক্ষমান আমন্ত্রণ নেই' : 'No pending sent invitations'}
              </p>
            ) : (
              <div className="space-y-2">
                {pendingSent.map((c) => (
                  <InvitationCard key={c.id} connection={c} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Family Member Modal */}
      <AddFamilyMember
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
      />

      {/* Update Username Dialog */}
      <UpdateUsernameDialog
        open={usernameModalOpen}
        onOpenChange={setUsernameModalOpen}
        currentUsername={currentUsername}
        userEmail={userEmail}
        userName={profile?.name || null}
      />

      {/* Member Health & Medication Timeline Panel Modal */}
      {selectedMemberId && (
        <MemberHealthPanel
          memberId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </div>
  )
}
