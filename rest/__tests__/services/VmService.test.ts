import { UrlAction, VmStatus } from '@prisma/client'

import { getActionByUrlAction, findNextVmState } from '../../src/services/VmService'


describe('findVmActionForUrlActionType', () => {
  it('should return the correct VM action for given URL action type', () => {

    const expected = 'CREATE'

    const result = getActionByUrlAction(UrlAction.NOTIFY_VM_INITIALIZE_START)

    expect(result).toEqual(expected)
  })
})

describe('findNextVmState', () => {
  it('should return INITIALIZING when current status is PROVISIONING_COMPLETED and next status is INITIALIZING', () => {
    const result = findNextVmState(VmStatus.PROVISIONING_COMPLETED, VmStatus.INITIALIZING)
    expect(result).toEqual(VmStatus.INITIALIZING)
  })

  it('should return RUNNING when current status is INITIALIZING and next status is RUNNING', () => {
    const result = findNextVmState(VmStatus.INITIALIZING, VmStatus.RUNNING)
    expect(result).toEqual(VmStatus.RUNNING)
  })

  it('should return RUNNING when current status is INITIALIZING and next status is RUNNING', () => {
    const result = findNextVmState(VmStatus.INITIALIZING, VmStatus.RUNNING)
    expect(result).toEqual(VmStatus.RUNNING)
  })

  it('should return DESTROYING when current status is TO_BE_DESTROYED and next status is DESTROYING', () => {
    const result = findNextVmState(VmStatus.TO_BE_DESTROYED, VmStatus.DESTROYING)
    expect(result).toEqual(VmStatus.DESTROYING)
  })

  it('should return TO_BE_DESTROYED when current status is TO_BE_DESTROYED and next status is RUNNING', () => {
    const result = findNextVmState(VmStatus.TO_BE_DESTROYED, VmStatus.RUNNING)
    expect(result).toEqual(VmStatus.TO_BE_DESTROYED)
  })
})
