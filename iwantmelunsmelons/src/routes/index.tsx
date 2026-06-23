import { createFileRoute } from '@tanstack/react-router'
import BirthdayPage from '../components/BirthdayPage'

export const Route = createFileRoute('/')({
  component: BirthdayPage,
})
