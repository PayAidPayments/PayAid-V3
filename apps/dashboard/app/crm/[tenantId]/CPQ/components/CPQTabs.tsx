import { Button } from '@/components/ui/button'
import { TABS } from './constants'
import { WorkspaceTab } from './types'

type CPQTabsProps = {
  activeTab: WorkspaceTab
  onTabChange: (tab: WorkspaceTab) => void
}

export function CPQTabs({ activeTab, onTabChange }: CPQTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <Button
          key={tab.id}
          size="sm"
          variant={activeTab === tab.id ? 'default' : 'outline'}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  )
}
