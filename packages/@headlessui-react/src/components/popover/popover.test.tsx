import React, { createElement } from 'react'
import { render } from '@testing-library/react'

import { Popover } from './popover'
import { suppressConsoleLogs } from '../../test-utils/suppress-console-logs'
import {
  PopoverState,
  assertPopoverPanel,
  assertPopoverButton,
  getPopoverButton,
  getPopoverPanel,
  getByText,
  assertActiveElement,
  assertContainsActiveElement,
} from '../../test-utils/accessibility-assertions'
import { click, press, Keys, MouseButton, shift } from '../../test-utils/interactions'

jest.mock('../../hooks/use-id')

afterAll(() => jest.restoreAllMocks())

describe('Safe guards', () => {
  it.each([
    ['Popover.Button', Popover.Button],
    ['Popover.Panel', Popover.Panel],
  ])(
    'should error when we are using a <%s /> without a parent <Popover />',
    suppressConsoleLogs((name, Component) => {
      expect(() => render(createElement(Component))).toThrowError(
        `<${name} /> is missing a parent <Popover /> component.`
      )
    })
  )

  it(
    'should be possible to render a Popover without crashing',
    suppressConsoleLogs(async () => {
      render(
        <Popover>
          <Popover.Button>Trigger</Popover.Button>
          <Popover.Panel>Contents</Popover.Panel>
        </Popover>
      )

      assertPopoverButton({
        state: PopoverState.InvisibleUnmounted,
        attributes: { id: 'headlessui-popover-button-1' },
      })
      assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })
    })
  )
})

describe('Rendering', () => {
  describe('Popover.Group', () => {
    it(
      'should be possible to render a Popover.Group with multiple Popover components',
      suppressConsoleLogs(async () => {
        render(
          <Popover.Group>
            <Popover>
              <Popover.Button>Trigger 1</Popover.Button>
              <Popover.Panel>Panel 1</Popover.Panel>
            </Popover>
            <Popover>
              <Popover.Button>Trigger 2</Popover.Button>
              <Popover.Panel>Panel 2</Popover.Panel>
            </Popover>
          </Popover.Group>
        )

        assertPopoverButton({ state: PopoverState.InvisibleUnmounted }, getByText('Trigger 1'))
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted }, getByText('Trigger 2'))

        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted }, getByText('Panel 1'))
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted }, getByText('Panel 2'))

        await click(getByText('Trigger 1'))

        assertPopoverButton({ state: PopoverState.Visible }, getByText('Trigger 1'))
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted }, getByText('Trigger 2'))

        assertPopoverPanel({ state: PopoverState.Visible }, getByText('Panel 1'))
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted }, getByText('Panel 2'))

        await click(getByText('Trigger 2'))

        assertPopoverButton({ state: PopoverState.InvisibleUnmounted }, getByText('Trigger 1'))
        assertPopoverButton({ state: PopoverState.Visible }, getByText('Trigger 2'))

        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted }, getByText('Panel 1'))
        assertPopoverPanel({ state: PopoverState.Visible }, getByText('Panel 2'))
      })
    )
  })

  describe('Popover', () => {
    it(
      'should be possible to render a Popover using a render prop',
      suppressConsoleLogs(async () => {
        render(
          <Popover>
            {({ open }) => (
              <>
                <Popover.Button>Trigger</Popover.Button>
                <Popover.Panel>Panel is: {open ? 'open' : 'closed'}</Popover.Panel>
              </>
            )}
          </Popover>
        )

        assertPopoverButton({
          state: PopoverState.InvisibleUnmounted,
          attributes: { id: 'headlessui-popover-button-1' },
        })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })

        await click(getPopoverButton())

        assertPopoverButton({
          state: PopoverState.Visible,
          attributes: { id: 'headlessui-popover-button-1' },
        })
        assertPopoverPanel({ state: PopoverState.Visible, textContent: 'Panel is: open' })
      })
    )
  })

  describe('Popover.Button', () => {
    it(
      'should be possible to render a Popover.Button using a render prop',
      suppressConsoleLogs(async () => {
        render(
          <Popover>
            <Popover.Button>{JSON.stringify}</Popover.Button>
            <Popover.Panel></Popover.Panel>
          </Popover>
        )

        assertPopoverButton({
          state: PopoverState.InvisibleUnmounted,
          attributes: { id: 'headlessui-popover-button-1' },
          textContent: JSON.stringify({ open: false }),
        })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })

        await click(getPopoverButton())

        assertPopoverButton({
          state: PopoverState.Visible,
          attributes: { id: 'headlessui-popover-button-1' },
          textContent: JSON.stringify({ open: true }),
        })
        assertPopoverPanel({ state: PopoverState.Visible })
      })
    )

    it(
      'should be possible to render a Popover.Button using a render prop and an `as` prop',
      suppressConsoleLogs(async () => {
        render(
          <Popover>
            <Popover.Button as="div" role="button">
              {JSON.stringify}
            </Popover.Button>
            <Popover.Panel />
          </Popover>
        )

        assertPopoverButton({
          state: PopoverState.InvisibleUnmounted,
          attributes: { id: 'headlessui-popover-button-1' },
          textContent: JSON.stringify({ open: false }),
        })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })

        await click(getPopoverButton())

        assertPopoverButton({
          state: PopoverState.Visible,
          attributes: { id: 'headlessui-popover-button-1' },
          textContent: JSON.stringify({ open: true }),
        })
        assertPopoverPanel({ state: PopoverState.Visible })
      })
    )
  })

  describe('Popover.Panel', () => {
    it(
      'should be possible to render Popover.Panel using a render prop',
      suppressConsoleLogs(async () => {
        render(
          <Popover>
            <Popover.Button>Trigger</Popover.Button>
            <Popover.Panel>{JSON.stringify}</Popover.Panel>
          </Popover>
        )

        assertPopoverButton({
          state: PopoverState.InvisibleUnmounted,
          attributes: { id: 'headlessui-popover-button-1' },
        })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })

        await click(getPopoverButton())

        assertPopoverButton({
          state: PopoverState.Visible,
          attributes: { id: 'headlessui-popover-button-1' },
        })
        assertPopoverPanel({
          state: PopoverState.Visible,
          textContent: JSON.stringify({ open: true }),
        })
      })
    )

    it('should be possible to always render the Popover.Panel if we provide it a `static` prop', () => {
      render(
        <Popover>
          <Popover.Button>Trigger</Popover.Button>
          <Popover.Panel static>Contents</Popover.Panel>
        </Popover>
      )

      // Let's verify that the Popover is already there
      expect(getPopoverPanel()).not.toBe(null)
    })

    it('should be possible to use a different render strategy for the Popover.Panel', async () => {
      render(
        <Popover>
          <Popover.Button>Trigger</Popover.Button>
          <Popover.Panel unmount={false}>Contents</Popover.Panel>
        </Popover>
      )

      getPopoverButton()?.focus()

      assertPopoverButton({ state: PopoverState.InvisibleHidden })
      assertPopoverPanel({ state: PopoverState.InvisibleHidden })

      // Let's open the Popover, to see if it is not hidden anymore
      await click(getPopoverButton())

      assertPopoverButton({ state: PopoverState.Visible })
      assertPopoverPanel({ state: PopoverState.Visible })

      // Let's re-click the Popover, to see if it is hidden again
      await click(getPopoverButton())

      assertPopoverButton({ state: PopoverState.InvisibleHidden })
      assertPopoverPanel({ state: PopoverState.InvisibleHidden })
    })
  })
})

describe('Keyboard interactions', () => {
  describe('`Enter` key', () => {
    it(
      'should be possible to open the Popover with Enter',
      suppressConsoleLogs(async () => {
        render(
          <Popover>
            <Popover.Button>Trigger</Popover.Button>
            <Popover.Panel>Contents</Popover.Panel>
          </Popover>
        )

        assertPopoverButton({
          state: PopoverState.InvisibleUnmounted,
          attributes: { id: 'headlessui-popover-button-1' },
        })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })

        // Focus the button
        getPopoverButton()?.focus()

        // Open popover
        await press(Keys.Enter)

        // Verify it is open
        assertPopoverButton({ state: PopoverState.Visible })
        assertPopoverPanel({
          state: PopoverState.Visible,
          attributes: { id: 'headlessui-popover-panel-2' },
        })

        // Close popover
        await press(Keys.Enter)
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted })
      })
    )

    it(
      'should not be possible to open the popover with Enter when the button is disabled',
      suppressConsoleLogs(async () => {
        render(
          <Popover>
            <Popover.Button disabled>Trigger</Popover.Button>
            <Popover.Panel>Content</Popover.Panel>
          </Popover>
        )

        assertPopoverButton({
          state: PopoverState.InvisibleUnmounted,
          attributes: { id: 'headlessui-popover-button-1' },
        })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })

        // Focus the button
        getPopoverButton()?.focus()

        // Try to open the popover
        await press(Keys.Enter)

        // Verify it is still closed
        assertPopoverButton({
          state: PopoverState.InvisibleUnmounted,
          attributes: { id: 'headlessui-popover-button-1' },
        })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })
      })
    )

    it(
      'should be possible to close the popover with Enter when the popover is open',
      suppressConsoleLogs(async () => {
        render(
          <Popover>
            <Popover.Button>Trigger</Popover.Button>
            <Popover.Panel>Contents</Popover.Panel>
          </Popover>
        )

        assertPopoverButton({
          state: PopoverState.InvisibleUnmounted,
          attributes: { id: 'headlessui-popover-button-1' },
        })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })

        // Focus the button
        getPopoverButton()?.focus()

        // Open popover
        await press(Keys.Enter)

        // Verify it is open
        assertPopoverButton({ state: PopoverState.Visible })
        assertPopoverPanel({
          state: PopoverState.Visible,
          attributes: { id: 'headlessui-popover-panel-2' },
        })

        // Close popover
        await press(Keys.Enter)

        // Verify it is closed again
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })
      })
    )

    it(
      'should close other popover menus when we open a new one',
      suppressConsoleLogs(async () => {
        render(
          <Popover.Group>
            <Popover>
              <Popover.Button>Trigger 1</Popover.Button>
              <Popover.Panel>Panel 1</Popover.Panel>
            </Popover>
            <Popover>
              <Popover.Button>Trigger 2</Popover.Button>
              <Popover.Panel>Panel 2</Popover.Panel>
            </Popover>
          </Popover.Group>
        )

        // Open the first Popover
        await click(getByText('Trigger 1'))

        // Verify the correct popovers are open
        assertPopoverButton({ state: PopoverState.Visible }, getByText('Trigger 1'))
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted }, getByText('Trigger 2'))

        // Focus trigger 2
        getByText('Trigger 2')?.focus()

        // Verify the correct popovers are open
        assertPopoverButton({ state: PopoverState.Visible }, getByText('Trigger 1'))
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted }, getByText('Trigger 2'))

        // Open the second popover
        await press(Keys.Enter)

        // Verify the correct popovers are open
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted }, getByText('Trigger 1'))
        assertPopoverButton({ state: PopoverState.Visible }, getByText('Trigger 2'))
      })
    )
  })

  describe('`Escape` key', () => {
    it(
      'should close the Popover menu, when pressing escape on the Popover.Button',
      suppressConsoleLogs(async () => {
        render(
          <Popover>
            <Popover.Button>Trigger</Popover.Button>
            <Popover.Panel>Contents</Popover.Panel>
          </Popover>
        )

        // Focus the button
        getPopoverButton()?.focus()

        // Verify popover is closed
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted })

        // Open popover
        await click(getPopoverButton())

        // Verify popover is open
        assertPopoverButton({ state: PopoverState.Visible })

        // Close popover
        await press(Keys.Escape)

        // Verify popover is closed
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted })

        // Verify button is (still) focused
        assertActiveElement(getPopoverButton())
      })
    )

    it(
      'should close the Popover menu, when pressing escape on the Popover.Panel',
      suppressConsoleLogs(async () => {
        render(
          <Popover>
            <Popover.Button>Trigger</Popover.Button>
            <Popover.Panel>
              <a href="/">Link</a>
            </Popover.Panel>
          </Popover>
        )

        // Focus the button
        getPopoverButton()?.focus()

        // Verify popover is closed
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted })

        // Open popover
        await click(getPopoverButton())

        // Verify popover is open
        assertPopoverButton({ state: PopoverState.Visible })

        // Tab to next focusable item
        await press(Keys.Tab)

        // Verify the active element is inside the panel
        assertContainsActiveElement(getPopoverPanel())

        // Close popover
        await press(Keys.Escape)

        // Verify popover is closed
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted })

        // Verify button is focused again
        assertActiveElement(getPopoverButton())
      })
    )

    it(
      'should be possible to close a sibling Popover when pressing escape on a sibling Popover.Button',
      suppressConsoleLogs(async () => {
        render(
          <Popover.Group>
            <Popover>
              <Popover.Button>Trigger 1</Popover.Button>
              <Popover.Panel>Panel 1</Popover.Panel>
            </Popover>

            <Popover>
              <Popover.Button>Trigger 2</Popover.Button>
              <Popover.Panel>Panel 2</Popover.Panel>
            </Popover>
          </Popover.Group>
        )

        // Focus the button of the first Popover
        getByText('Trigger 1')?.focus()

        // Verify popover is closed
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted }, getByText('Trigger 1'))
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted }, getByText('Trigger 2'))

        // Open popover
        await click(getByText('Trigger 1'))

        // Verify popover is open
        assertPopoverButton({ state: PopoverState.Visible }, getByText('Trigger 1'))
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted }, getByText('Trigger 2'))

        assertPopoverPanel({ state: PopoverState.Visible }, getByText('Panel 1'))
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted }, getByText('Panel 2'))

        // Focus the button of the second popover menu
        getByText('Trigger 2')?.focus()

        // Close popover
        await press(Keys.Escape)

        // Verify both popovers are closed
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted }, getByText('Trigger 1'))
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted }, getByText('Trigger 2'))

        // Verify the button of the second popover is still focused
        assertActiveElement(getByText('Trigger 2'))
      })
    )
  })

  describe('`Tab` key', () => {
    it(
      'should be possible to Tab through the panel contents onto the next Popover.Button',
      suppressConsoleLogs(async () => {
        render(
          <Popover.Group>
            <Popover>
              <Popover.Button>Trigger 1</Popover.Button>
              <Popover.Panel>
                <a href="/">Link 1</a>
                <a href="/">Link 2</a>
              </Popover.Panel>
            </Popover>

            <Popover>
              <Popover.Button>Trigger 2</Popover.Button>
              <Popover.Panel>Panel 2</Popover.Panel>
            </Popover>
          </Popover.Group>
        )

        // Focus the button of the first Popover
        getByText('Trigger 1')?.focus()

        // Open popover
        await click(getByText('Trigger 1'))

        // Verify we are focused on the first link
        await press(Keys.Tab)
        assertActiveElement(getByText('Link 1'))

        // Verify we are focused on the second link
        await press(Keys.Tab)
        assertActiveElement(getByText('Link 2'))

        // Let's Tab again
        await press(Keys.Tab)

        // Verify that the first Popover is still open
        assertPopoverButton({ state: PopoverState.Visible })
        assertPopoverPanel({ state: PopoverState.Visible })

        // Verify that the second button is focused
        assertActiveElement(getByText('Trigger 2'))
      })
    )

    it(
      'should close the Popover menu once we Tab out of the Popover.Group',
      suppressConsoleLogs(async () => {
        render(
          <>
            <Popover.Group>
              <Popover>
                <Popover.Button>Trigger 1</Popover.Button>
                <Popover.Panel>
                  <a href="/">Link 1</a>
                  <a href="/">Link 2</a>
                </Popover.Panel>
              </Popover>

              <Popover>
                <Popover.Button>Trigger 2</Popover.Button>
                <Popover.Panel>
                  <a href="/">Link 3</a>
                  <a href="/">Link 4</a>
                </Popover.Panel>
              </Popover>
            </Popover.Group>

            <a href="/">Next</a>
          </>
        )

        // Focus the button of the first Popover
        getByText('Trigger 1')?.focus()

        // Open popover
        await click(getByText('Trigger 1'))

        // Verify we are focused on the first link
        await press(Keys.Tab)
        assertActiveElement(getByText('Link 1'))

        // Verify we are focused on the second link
        await press(Keys.Tab)
        assertActiveElement(getByText('Link 2'))

        // Let's Tab again
        await press(Keys.Tab)

        // Verify that the first Popover is still open
        assertPopoverButton({ state: PopoverState.Visible })
        assertPopoverPanel({ state: PopoverState.Visible })

        // Verify that the second button is focused
        assertActiveElement(getByText('Trigger 2'))

        // Let's Tab out of the Popover.Group
        await press(Keys.Tab)

        // Verify the next link is now focused
        assertActiveElement(getByText('Next'))

        // Verify the popover is closed
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })
      })
    )

    it(
      'should close the Popover menu once we Tab out of the Popover',
      suppressConsoleLogs(async () => {
        render(
          <>
            <Popover>
              <Popover.Button>Trigger 1</Popover.Button>
              <Popover.Panel>
                <a href="/">Link 1</a>
                <a href="/">Link 2</a>
              </Popover.Panel>
            </Popover>

            <a href="/">Next</a>
          </>
        )

        // Focus the button of the first Popover
        getByText('Trigger 1')?.focus()

        // Open popover
        await click(getByText('Trigger 1'))

        // Verify we are focused on the first link
        await press(Keys.Tab)
        assertActiveElement(getByText('Link 1'))

        // Verify we are focused on the second link
        await press(Keys.Tab)
        assertActiveElement(getByText('Link 2'))

        // Let's Tab out of the Popover
        await press(Keys.Tab)

        // Verify the next link is now focused
        assertActiveElement(getByText('Next'))

        // Verify the popover is closed
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })
      })
    )
  })

  describe('`Shift+Tab` key', () => {
    it(
      'should close the Popover menu once we Tab out of the Popover.Group',
      suppressConsoleLogs(async () => {
        render(
          <>
            <a href="/">Previous</a>

            <Popover.Group>
              <Popover>
                <Popover.Button>Trigger 1</Popover.Button>
                <Popover.Panel>
                  <a href="/">Link 1</a>
                  <a href="/">Link 2</a>
                </Popover.Panel>
              </Popover>

              <Popover>
                <Popover.Button>Trigger 2</Popover.Button>
                <Popover.Panel>
                  <a href="/">Link 3</a>
                  <a href="/">Link 4</a>
                </Popover.Panel>
              </Popover>
            </Popover.Group>
          </>
        )

        // Focus the button of the second Popover
        getByText('Trigger 2')?.focus()

        // Open popover
        await click(getByText('Trigger 2'))

        // Verify we can tab to Trigger 1
        await press(shift(Keys.Tab))
        assertActiveElement(getByText('Trigger 1'))

        // Let's Tab out of the Popover.Group
        await press(shift(Keys.Tab))

        // Verify the previous link is now focused
        assertActiveElement(getByText('Previous'))

        // Verify the popover is closed
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })
      })
    )

    it(
      'should close the Popover menu once we Tab out of the Popover',
      suppressConsoleLogs(async () => {
        render(
          <>
            <a href="/">Previous</a>

            <Popover>
              <Popover.Button>Trigger 1</Popover.Button>
              <Popover.Panel>
                <a href="/">Link 1</a>
                <a href="/">Link 2</a>
              </Popover.Panel>
            </Popover>
          </>
        )

        // Focus the button of the Popover
        getPopoverButton()?.focus()

        // Open popover
        await click(getPopoverButton())

        // Let's Tab out of the Popover
        await press(shift(Keys.Tab))

        // Verify the previous link is now focused
        assertActiveElement(getByText('Previous'))

        // Verify the popover is closed
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })
      })
    )
  })

  describe('`Space` key', () => {
    it(
      'should be possible to open the popover with Space',
      suppressConsoleLogs(async () => {
        render(
          <Popover>
            <Popover.Button>Trigger</Popover.Button>
            <Popover.Panel>Contents</Popover.Panel>
          </Popover>
        )

        assertPopoverButton({
          state: PopoverState.InvisibleUnmounted,
          attributes: { id: 'headlessui-popover-button-1' },
        })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })

        // Focus the button
        getPopoverButton()?.focus()

        // Open popover
        await press(Keys.Space)

        // Verify it is open
        assertPopoverButton({ state: PopoverState.Visible })
        assertPopoverPanel({
          state: PopoverState.Visible,
          attributes: { id: 'headlessui-popover-panel-2' },
        })
      })
    )

    it(
      'should not be possible to open the popover with Space when the button is disabled',
      suppressConsoleLogs(async () => {
        render(
          <Popover>
            <Popover.Button disabled>Trigger</Popover.Button>
            <Popover.Panel>Contents</Popover.Panel>
          </Popover>
        )

        assertPopoverButton({
          state: PopoverState.InvisibleUnmounted,
          attributes: { id: 'headlessui-popover-button-1' },
        })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })

        // Focus the button
        getPopoverButton()?.focus()

        // Try to open the popover
        await press(Keys.Space)

        // Verify it is still closed
        assertPopoverButton({
          state: PopoverState.InvisibleUnmounted,
          attributes: { id: 'headlessui-popover-button-1' },
        })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })
      })
    )

    it(
      'should be possible to close the popover with Space when the popover is open',
      suppressConsoleLogs(async () => {
        render(
          <Popover>
            <Popover.Button>Trigger</Popover.Button>
            <Popover.Panel>Contents</Popover.Panel>
          </Popover>
        )

        assertPopoverButton({
          state: PopoverState.InvisibleUnmounted,
          attributes: { id: 'headlessui-popover-button-1' },
        })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })

        // Focus the button
        getPopoverButton()?.focus()

        // Open popover
        await press(Keys.Space)

        // Verify it is open
        assertPopoverButton({ state: PopoverState.Visible })
        assertPopoverPanel({
          state: PopoverState.Visible,
          attributes: { id: 'headlessui-popover-panel-2' },
        })

        // Close popover
        await press(Keys.Space)

        // Verify it is closed again
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted })
        assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })
      })
    )

    it(
      'should close other popover menus when we open a new one',
      suppressConsoleLogs(async () => {
        render(
          <Popover.Group>
            <Popover>
              <Popover.Button>Trigger 1</Popover.Button>
              <Popover.Panel>Panel 1</Popover.Panel>
            </Popover>
            <Popover>
              <Popover.Button>Trigger 2</Popover.Button>
              <Popover.Panel>Panel 2</Popover.Panel>
            </Popover>
          </Popover.Group>
        )

        // Open the first Popover
        await click(getByText('Trigger 1'))

        // Verify the correct popovers are open
        assertPopoverButton({ state: PopoverState.Visible }, getByText('Trigger 1'))
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted }, getByText('Trigger 2'))

        // Focus trigger 2
        getByText('Trigger 2')?.focus()

        // Verify the correct popovers are open
        assertPopoverButton({ state: PopoverState.Visible }, getByText('Trigger 1'))
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted }, getByText('Trigger 2'))

        // Open the second popover
        await press(Keys.Space)

        // Verify the correct popovers are open
        assertPopoverButton({ state: PopoverState.InvisibleUnmounted }, getByText('Trigger 1'))
        assertPopoverButton({ state: PopoverState.Visible }, getByText('Trigger 2'))
      })
    )
  })
})

describe('Mouse interactions', () => {
  it(
    'should be possible to open a popover on click',
    suppressConsoleLogs(async () => {
      render(
        <Popover>
          <Popover.Button>Trigger</Popover.Button>
          <Popover.Panel>Contents</Popover.Panel>
        </Popover>
      )

      assertPopoverButton({
        state: PopoverState.InvisibleUnmounted,
        attributes: { id: 'headlessui-popover-button-1' },
      })
      assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })

      // Open popover
      await click(getPopoverButton())

      // Verify it is open
      assertPopoverButton({ state: PopoverState.Visible })
      assertPopoverPanel({
        state: PopoverState.Visible,
        attributes: { id: 'headlessui-popover-panel-2' },
      })
    })
  )

  it(
    'should not be possible to open a popover on right click',
    suppressConsoleLogs(async () => {
      render(
        <Popover>
          <Popover.Button>Trigger</Popover.Button>
          <Popover.Panel>Contents</Popover.Panel>
        </Popover>
      )

      assertPopoverButton({
        state: PopoverState.InvisibleUnmounted,
        attributes: { id: 'headlessui-popover-button-1' },
      })
      assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })

      // Open popover
      await click(getPopoverButton(), MouseButton.Right)

      // Verify it is still closed
      assertPopoverButton({
        state: PopoverState.InvisibleUnmounted,
        attributes: { id: 'headlessui-popover-button-1' },
      })
      assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })
    })
  )

  it(
    'should not be possible to open a popover on click when the button is disabled',
    suppressConsoleLogs(async () => {
      render(
        <Popover>
          <Popover.Button disabled>Trigger</Popover.Button>
          <Popover.Panel>Contents</Popover.Panel>
        </Popover>
      )

      assertPopoverButton({
        state: PopoverState.InvisibleUnmounted,
        attributes: { id: 'headlessui-popover-button-1' },
      })
      assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })

      // Try to open the popover
      await click(getPopoverButton())

      // Verify it is still closed
      assertPopoverButton({
        state: PopoverState.InvisibleUnmounted,
        attributes: { id: 'headlessui-popover-button-1' },
      })
      assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })
    })
  )

  it(
    'should be possible to close a popover on click',
    suppressConsoleLogs(async () => {
      render(
        <Popover>
          <Popover.Button>Trigger</Popover.Button>
          <Popover.Panel>Contents</Popover.Panel>
        </Popover>
      )

      getPopoverButton()?.focus()

      // Open popover
      await click(getPopoverButton())

      // Verify it is open
      assertPopoverButton({ state: PopoverState.Visible })

      // Click to close
      await click(getPopoverButton())

      // Verify it is closed
      assertPopoverButton({ state: PopoverState.InvisibleUnmounted })
      assertPopoverPanel({ state: PopoverState.InvisibleUnmounted })
    })
  )
})
