import React from 'react'
import { Popover } from '@headlessui/react'

export default function Home() {
  return (
    <div className="flex">
      <Popover.Group as="nav" ar-label="Mythical University" className="flex space-x-3 m-12">
        <Popover as="div" className="relative">
          <Popover.Button className="px-3 py-2 bg-gray-300">About</Popover.Button>
          <Popover.Panel className="absolute flex flex-col w-64 bg-gray-100 border-2 border-blue-900">
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Overview
            </a>
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Administration
            </a>
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Facts
            </a>
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Campus Tours
            </a>
          </Popover.Panel>
        </Popover>

        <Popover as="div" className="relative">
          <Popover.Button className="px-3 py-2 bg-gray-300">Admissions</Popover.Button>
          <Popover.Panel className="absolute flex flex-col w-64 bg-gray-100 border-2 border-blue-900">
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Apply
            </a>
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Tuition
            </a>
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Sign Up
            </a>
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Visit
            </a>
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Photo Tour
            </a>
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Connect
            </a>
          </Popover.Panel>
        </Popover>

        <Popover as="div" className="relative">
          <Popover.Button className="px-3 py-2 bg-gray-300">Academics</Popover.Button>
          <Popover.Panel className="absolute flex flex-col w-64 bg-gray-100 border-2 border-blue-900">
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Colleges & Schools
            </a>
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Programs of Study
            </a>
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Honors Programs
            </a>
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Online Courses
            </a>
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Course Explorer
            </a>
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Register for Class
            </a>
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Academic Calendar
            </a>
            <a href="/" className="px-3 py-2 hover:bg-gray-200">
              Transcripts
            </a>
          </Popover.Panel>
        </Popover>
      </Popover.Group>

      <div className="m-12">
        <a href="/">Some link that can be focused</a>
      </div>
    </div>
  )
}
