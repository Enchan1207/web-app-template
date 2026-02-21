import { createFileRoute } from '@tanstack/react-router'

const About: React.FC = () => {
  return <div className="p-2">Public page</div>
}

export const Route = createFileRoute('/about/')({
  component: About,
})
