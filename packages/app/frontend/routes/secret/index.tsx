import { createFileRoute } from '@tanstack/react-router'

const About: React.FC = () => {
  return <div className="p-2">Secret page for logged in user</div>
}

export const Route = createFileRoute('/secret/')({
  component: About,
})
