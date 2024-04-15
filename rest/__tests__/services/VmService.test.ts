import { getActionByUrlActionType, findNextVmState } from '../../src/services/VmService'
import { UrlActionType } from '../../src/utils/UrlActionType'
import { VmStatusType } from '../../src/utils/VmStatusType'


describe('findVmActionForUrlActionType', () => {
  it('should return the correct VM action for given URL action type', () => {

    const expected = 'CREATE'

    const result = getActionByUrlActionType(UrlActionType.NOTIFY_VM_INITIALIZE_START)

    expect(result).toEqual(expected)
  })
})

describe('findNextVmState', () => {
  it('should return INITIALIZING when current status is PROVISIONING_COMPLETED and next status is INITIALIZING', () => {
    const result = findNextVmState(VmStatusType.PROVISIONING_COMPLETED, VmStatusType.INITIALIZING)
    expect(result).toEqual(VmStatusType.INITIALIZING)
  })

  it('should return RUNNING when current status is INITIALIZING and next status is RUNNING', () => {
    const result = findNextVmState(VmStatusType.INITIALIZING, VmStatusType.RUNNING)
    expect(result).toEqual(VmStatusType.RUNNING)
  })

  it('should return RUNNING when current status is INITIALIZING and next status is RUNNING', () => {
    const result = findNextVmState(VmStatusType.INITIALIZING, VmStatusType.RUNNING)
    expect(result).toEqual(VmStatusType.RUNNING)
  })

  it('should return DESTROYING when current status is TO_BE_DESTROYED and next status is DESTROYING', () => {
    const result = findNextVmState(VmStatusType.TO_BE_DESTROYED, VmStatusType.DESTROYING)
    expect(result).toEqual(VmStatusType.DESTROYING)
  })

  it('should return TO_BE_DESTROYED when current status is TO_BE_DESTROYED and next status is RUNNING', () => {
    const result = findNextVmState(VmStatusType.TO_BE_DESTROYED, VmStatusType.RUNNING)
    expect(result).toEqual(VmStatusType.TO_BE_DESTROYED)
  })
})
