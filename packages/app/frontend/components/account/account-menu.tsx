import { Button } from '@frontend/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@frontend/components/ui/dropdown-menu'
import { useUser } from '@frontend/hooks/use-user'
import { client } from '@frontend/lib/client'
import { useRouterState } from '@tanstack/react-router'
import { User } from 'lucide-react'

const AccountMenu: React.FC = () => {
  const { data, isPending } = useUser()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const handleLogin = async () => {
    const redirectUrl = await client.auth.login
      .$post({
        json: { return_to: pathname },
      })
      .then(async (response) => {
        if (!response.ok) {
          return
        }

        const data = await response.json()
        return data.redirect_to
      })
      .catch(() => undefined)

    if (redirectUrl !== undefined) {
      window.location.href = redirectUrl
    }
  }

  if (isPending) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        aria-label="アカウント情報を読み込み中"
      >
        <User className="h-5 w-5 animate-pulse opacity-60" />
      </Button>
    )
  }

  if (data === null || data === undefined) {
    return <Button onClick={handleLogin}>ログイン</Button>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="アカウントメニュー"
          className="focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-transparent dark:hover:bg-transparent"
        >
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled>{data.email}</DropdownMenuItem>
        <form action="/api/auth/logout" method="post">
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full text-left">
              ログアウト
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default AccountMenu
