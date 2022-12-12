import { useContext, useState, useEffect } from 'react'

import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { GoogleAutoComplete } from 'components/GoogleAutoComplete'
import { Toggle } from 'components/Toggle'
import { UserSearch } from 'components/UserSearch'

import { Context } from '../../context'

import * as S from './styles'
import {
  AddressType,
  FormAction,
  Toggle as ToggleType
} from '../../context/quote'
import { QuoteInput } from '../QuoteInput'
import { Button } from '@alirok.com/rok-ui'
import {
  Company,
  UserMaskedAddress,
  Member,
  AirportList
} from '../../services/rokApiV2.declarations'
import { AirportSearch } from '../AirportSearch'
import { CompanySearch } from '../CompanySearch'
import { MembersSearch } from '../MembersSearch'
import { RequiredStringSchema } from 'yup/lib/string'
import { useAuth } from '../../hooks/useAuth'
import { useLocale } from 'hooks/useLocale'

interface IForm {
  addressType: AddressType
  zipCode: string
  country: string
  state: string
  street: string
  streetNumber: string
  city: string
  additionalAddress: string | undefined
  complementAddress: string | undefined
  formattedAddress: string | undefined
  userId: string | undefined
  companyId: string | undefined
  memberId: string | undefined
  memberName: string | undefined
  userName: string | undefined
  userAvatar: string | undefined
  airportId: string | undefined
  airportIataCode: string | undefined
  airportName: string | undefined
  airportLocation: string | undefined
}

interface IProps {
  onFinish: () => void
  close: () => void
  goBack: () => void
  editSummary?: boolean
  isLandTab: boolean
  isAirTab: boolean
}

export function WhereTo({
  onFinish,
  close,
  goBack,
  editSummary,
  isLandTab,
  isAirTab
}: IProps) {
  const { t } = useLocale()
  const { state, dispatch } = useContext(Context)
  const { user } = useAuth()

  const [whereToState, setWhereToState] = useState<IForm>()

  useEffect(() => {
    if (whereToState) onFinish()
  }, [whereToState, onFinish])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<IForm>({
    resolver: yupResolver(
      yup.object({
        addressType: yup
          .string()
          .required('Address Type is required') as RequiredStringSchema<
          AddressType | undefined,
          Record<string, unknown>
        >,
        zipCode: yup.string().required(t.whereTo.form.zipCodeRequiredError),
        country: yup.string().required(t.whereTo.form.countryRequiredError),
        state: yup.string().required(t.whereTo.form.stateRequiredError),
        street: yup.string().required(t.whereTo.form.streetRequiredError),
        streetNumber: yup
          .string()
          .required(t.whereTo.form.streetNumberRequiredError),
        city: yup.string().required(t.whereTo.form.cityRequiredError),
        additionalAddress: yup.string().notRequired(),
        complementAddress: yup.string().notRequired(),
        formattedAddress: yup.string().notRequired(),
        userId: yup.string().notRequired(),
        companyId: yup.string().notRequired(),
        memberId: yup.string().notRequired(),
        userName: yup.string().notRequired(),
        userAvatar: yup.string().notRequired(),
        airportId: yup.string().notRequired()
      })
    ),
    defaultValues: {
      ...state.quote.data.whereTo.data,
      formattedAddress: '',
      additionalAddress: state?.quote?.data?.whereTo?.data?.additionalAddress
        ? state.quote.data.whereTo.data.additionalAddress
        : '',
      complementAddress: state?.quote?.data?.whereTo?.data?.complementAddress
        ? state.quote.data.whereTo.data.complementAddress
        : ''
    }
  })

  const getFormattedAddress = (data: IForm) => {
    if (data.formattedAddress) {
      return data.formattedAddress
    } else {
      return `${data.street} - ${data.state}, ${data.country}`
    }
  }

  const isInternational = () => {
    return (
      state.quote.data.whereFrom.data?.country !==
      state.quote.data.whereTo.data?.country
    )
  }

  const isInternationalAndPackage = () => {
    return isInternational() && state.quote.data.type !== 'document'
  }

  const shouldInvalidateWhatsInside = (data: IForm) => {
    return state.quote.data.whatsInside.data &&
      ((isInternationalAndPackage() &&
        state.quote?.data?.whereFrom?.data?.country === data.country) ||
        (!isInternational() &&
          state.quote.data.type === 'package' &&
          state.quote?.data?.whereFrom?.data?.country !== data.country))
      ? true
      : false
  }

  const getWhatsInsideNewData = (data: IForm) => {
    if (
      isInternationalAndPackage() &&
      state.quote?.data?.whereFrom?.data?.country === data.country
    ) {
      return {
        whatsInside: {
          data: state.quote.data.whatsInside.data
        }
      }
    } else {
      if (
        !isInternational() &&
        state.quote?.data?.whereFrom?.data?.country !== data.country &&
        state.quote.data.type === 'package' &&
        state.quote?.data?.whatsInside?.data &&
        state.quote?.data?.whatsInside?.data?.length > 1
      ) {
        return {
          whatsInside: {
            data: undefined
          }
        }
      } else {
        return {
          whatsInside: {
            data: state.quote.data.whatsInside.data
          }
        }
      }
    }
  }

  const getWhatsInsideFormNewData = (data: IForm) => {
    if (
      state.quote?.data?.whereFrom?.data?.country !== data.country &&
      state.quote.data.type === 'package' &&
      state.quote?.data?.whatsInside?.data &&
      state.quote?.data?.whatsInside?.data?.length <= 1
    ) {
      return {
        whatsInside: {
          step: 1,
          index: 0,
          action: 'edit' as FormAction,
          isValid: false
        }
      }
    } else {
      return {
        whatsInside: {
          step: 0,
          index: undefined,
          action: undefined,
          isValid: false
        }
      }
    }
  }

  const onSubmit = (data: IForm) => {
    if (isDirty || !editSummary || !state.quote.form.whatsInside.isValid) {
      const newData = {
        form: {
          ...state.quote.form,
          whereTo: {
            ...state.quote.form.whereTo,
            formattedAddress: getFormattedAddress(data),
            isValid: true
          },
          ...(shouldInvalidateWhatsInside(data) &&
            getWhatsInsideFormNewData(data))
        },
        data: {
          ...state.quote.data,
          whereTo: {
            data
          },
          ...(shouldInvalidateWhatsInside(data) && getWhatsInsideNewData(data))
        }
      }
      dispatch({
        type: 'UPDATE_SEARCH_DATA',
        value: newData
      })

      let preFilledValue:
        | 'ADDRESS'
        | 'AIRPORT'
        | 'USER'
        | 'MEMBER'
        | 'COMPANY' = 'ADDRESS'

      if (data.userId) {
        preFilledValue = 'USER'
      }
      if (data.companyId) {
        preFilledValue = 'COMPANY'
      }
      if (data.memberId) {
        preFilledValue = 'MEMBER'
      }
      if (data.airportId) {
        preFilledValue = 'AIRPORT'
      }

      dispatch({
        type: 'SET_RECIPIENT_DATA',
        value: {
          ...(data.userId && { userId: data.userId }),
          ...(data.companyId && { companyId: data.companyId }),
          ...(data.memberId && { memberId: data.memberId }),
          ...(data.airportId && { airportId: data.airportId }),
          ...(!isAirTab && { address: data }),
          pre_filled: preFilledValue
        }
      })

      setWhereToState(data)
    } else {
      close()
    }
  }

  const handleUserSearchResult = (result: UserMaskedAddress) => {
    const zipCodeResult = result?.address?.postal_code

    const countryResult = result?.address?.country

    const stateResult = result?.address?.state

    const streetResult = result?.address?.street

    const streetNumberResult = result?.address?.street_number

    const cityResult = result?.address?.city

    const address_type = result?.address?.address_type

    if (result?.user_uuid) {
      setValue('userId', result?.user_uuid)
    } else {
      setValue('userId', '')
    }

    if (result?.first_name) {
      setValue('userName', result?.first_name)
    } else {
      setValue('userName', '')
    }

    if (result?.photo) {
      setValue('userAvatar', result?.photo)
    } else {
      setValue('userAvatar', '')
    }

    if (zipCodeResult) {
      setValue('zipCode', zipCodeResult, { shouldDirty: true })
    } else {
      setValue('zipCode', '', { shouldDirty: true })
    }

    if (countryResult) {
      setValue('country', countryResult, { shouldDirty: true })
    } else {
      setValue('country', '', { shouldDirty: true })
    }

    if (stateResult) {
      setValue('state', stateResult, { shouldDirty: true })
    } else {
      setValue('state', '', { shouldDirty: true })
    }

    if (streetResult) {
      setValue('street', streetResult, { shouldDirty: true })
    } else {
      setValue('street', '', { shouldDirty: true })
    }

    if (streetNumberResult) {
      setValue('streetNumber', streetNumberResult, { shouldDirty: true })
    } else {
      setValue('streetNumber', '', { shouldDirty: true })
    }

    if (cityResult) {
      setValue('city', cityResult, { shouldDirty: true })
    } else {
      setValue('city', '', { shouldDirty: true })
    }

    if (address_type) {
      setValue(
        'addressType',
        address_type.toLocaleLowerCase() as 'residential' | 'commercial'
      )
    } else {
      setValue('addressType', 'residential')
    }

    setValue('additionalAddress', '', { shouldDirty: true })
    setValue('complementAddress', '', { shouldDirty: true })

    setValue('companyId', '')
    setValue('memberId', '')
  }

  const handleAirportSearchResult = (result: AirportList) => {
    if (result?.airport_uuid) {
      setValue('airportId', result?.airport_uuid)
    } else {
      setValue('airportId', '')
    }

    if (result?.iata_code) {
      setValue('airportIataCode', result?.iata_code)
    } else {
      setValue('airportIataCode', '')
    }
    if (result?.name) {
      setValue('airportName', result?.name)
    } else {
      setValue('airportName', '')
    }

    const airportData = {
      form: {
        ...state.quote.form,
        whereTo: {
          ...state.quote.form.whereFrom,
          formattedAddress: `${result.iata_code} - ${result.name}`,
          isValid: true
        }
      },
      data: {
        ...state.quote.data,
        whereTo: {
          ...state.quote.data.whereFrom,
          data: {
            ...state.quote.data.whereFrom.data,
            airportId: result?.airport_uuid || '',
            airportIataCode: result?.iata_code || '',
            airportName: result?.name || ''
          }
        }
      }
    }

    dispatch({
      type: 'UPDATE_SEARCH_DATA',
      value: airportData
    })

    onFinish()
  }

  const handleCompanySearchResult = (result: Company) => {
    const zipCodeResult = result?.address?.postal_code

    const countryResult = result?.address?.country

    const stateResult = result?.address?.state

    const streetResult = result?.address?.street

    const streetNumberResult = result?.address?.street_number

    const cityResult = result?.address?.city

    const address_type = result?.address?.address_type

    if (result?.company_uuid) {
      setValue('companyId', result?.company_uuid, { shouldDirty: true })
    } else {
      setValue('companyId', '', { shouldDirty: true })
    }

    if (zipCodeResult) {
      setValue('zipCode', zipCodeResult, { shouldDirty: true })
    } else {
      setValue('zipCode', '', { shouldDirty: true })
    }

    if (countryResult) {
      setValue('country', countryResult, { shouldDirty: true })
    } else {
      setValue('country', '', { shouldDirty: true })
    }

    if (stateResult) {
      setValue('state', stateResult, { shouldDirty: true })
    } else {
      setValue('state', '', { shouldDirty: true })
    }

    if (streetResult) {
      setValue('street', streetResult, { shouldDirty: true })
    } else {
      setValue('street', '', { shouldDirty: true })
    }

    if (streetNumberResult) {
      setValue('streetNumber', streetNumberResult, { shouldDirty: true })
    } else {
      setValue('streetNumber', '', { shouldDirty: true })
    }

    if (cityResult) {
      setValue('city', cityResult, { shouldDirty: true })
    } else {
      setValue('city', '', { shouldDirty: true })
    }

    if (address_type) {
      setValue(
        'addressType',
        address_type.toLocaleLowerCase() as 'residential' | 'commercial'
      )
    } else {
      setValue('addressType', 'residential')
    }

    setValue('additionalAddress', '', { shouldDirty: true })
    setValue('complementAddress', '', { shouldDirty: true })
    setValue('memberId', '')
    setValue('userId', '')
    setValue('userName', '')
    setValue('userAvatar', '')
  }

  const handleMembersSearchResult = (result: Member) => {
    const zipCodeResult = result?.address?.postal_code

    const countryResult = result?.address?.country

    const stateResult = result?.address?.state

    const streetResult = result?.address?.street

    const streetNumberResult = result?.address?.street_number

    const cityResult = result?.address?.city

    const address_type = result?.address?.address_type

    if (result?.parcel_member_uuid) {
      setValue('memberId', result?.parcel_member_uuid, { shouldDirty: true })
    } else {
      setValue('memberId', '', { shouldDirty: true })
    }

    if (result?.full_name) {
      setValue('memberName', result?.full_name, { shouldDirty: true })
    } else {
      setValue('memberName', '', { shouldDirty: true })
    }

    if (zipCodeResult) {
      setValue('zipCode', zipCodeResult, { shouldDirty: true })
    } else {
      setValue('zipCode', '', { shouldDirty: true })
    }

    if (countryResult) {
      setValue('country', countryResult, { shouldDirty: true })
    } else {
      setValue('country', '', { shouldDirty: true })
    }

    if (stateResult) {
      setValue('state', stateResult, { shouldDirty: true })
    } else {
      setValue('state', '', { shouldDirty: true })
    }

    if (streetResult) {
      setValue('street', streetResult, { shouldDirty: true })
    } else {
      setValue('street', '', { shouldDirty: true })
    }

    if (streetNumberResult) {
      setValue('streetNumber', streetNumberResult)
    } else {
      setValue('streetNumber', '', { shouldDirty: true })
    }

    if (cityResult) {
      setValue('city', cityResult, { shouldDirty: true })
    } else {
      setValue('city', '', { shouldDirty: true })
    }

    if (address_type) {
      setValue(
        'addressType',
        address_type.toLocaleLowerCase() as 'residential' | 'commercial'
      )
    } else {
      setValue('addressType', 'residential')
    }

    setValue('additionalAddress', '', { shouldDirty: true })
    setValue('companyId', '')
    setValue('userId', '')
    setValue('userName', '')
    setValue('userAvatar', '')
  }

  const handleGoogleAutoCompleteResult = (
    results: google.maps.GeocoderResult[]
  ) => {
    const result = results[0]

    if (result.formatted_address) {
      const skipedChars = result.formatted_address.replace(/#/g, '')
      setValue('formattedAddress', skipedChars, {
        shouldDirty: true
      })
    }

    const zipCodeResult = result.address_components.find((e) =>
      e.types.includes('postal_code')
    )

    const countryResult = result.address_components.find((e) =>
      e.types.includes('country')
    )

    const stateResult = result.address_components.find((e) =>
      e.types.includes('administrative_area_level_1')
    )

    const streetResult = result.address_components.find((e) =>
      e.types.includes('route')
    )

    const streetNumberResult = result.address_components.find((e) =>
      e.types.includes('street_number')
    )

    const cityResult = result.address_components.find(
      (e) =>
        e.types.includes('locality') ||
        e.types.includes('administrative_area_level_2')
    )

    if (zipCodeResult) {
      setValue('zipCode', zipCodeResult.short_name, { shouldDirty: true })
    } else {
      setValue('zipCode', '', { shouldDirty: true })
    }

    if (countryResult) {
      setValue('country', countryResult.short_name, { shouldDirty: true })
    } else {
      setValue('country', '', { shouldDirty: true })
    }

    if (stateResult) {
      setValue('state', stateResult.short_name, { shouldDirty: true })
    } else {
      setValue('state', '', { shouldDirty: true })
    }

    if (streetResult) {
      setValue('street', streetResult.short_name, { shouldDirty: true })
    } else {
      setValue('street', '', { shouldDirty: true })
    }

    if (streetNumberResult) {
      setValue('streetNumber', streetNumberResult.short_name, {
        shouldDirty: true
      })
    } else {
      setValue('streetNumber', '', { shouldDirty: true })
    }

    if (cityResult) {
      setValue('city', cityResult.short_name, { shouldDirty: true })
    } else {
      setValue('city', '', { shouldDirty: true })
    }

    setValue('additionalAddress', '', { shouldDirty: true })
    setValue('userId', '')
    setValue('companyId', '')
    setValue('memberId', '')
    setValue('userName', '')
    setValue('userAvatar', '')
  }

  return (
    <S.Container>
      {state.quote.form.whereTo.step === 0 && (
        <>
          <S.PopUpWrapper>
            <S.Top>
              <S.BackFrom
                onClick={() => {
                  goBack()
                }}
                src="https://static.alirok.io/collections/icons/arrow-down.svg"
              />
              <S.ToggleWrapper widthMobile="100%">
                <Toggle
                  onChange={(e) => {
                    dispatch({
                      type: 'SET_WHERE_TO_TOGGLE',
                      value: e.target.value as ToggleType
                    })
                  }}
                  checked={state.quote.form.whereTo.toggle}
                  name="whereFromToggle"
                  items={
                    isAirTab
                      ? user
                        ? [
                            {
                              label: t.whereFrom.whereFromToggle.byAddress,
                              value: 'byAddress'
                            },
                            {
                              label: t.whereFrom.whereFromToggle.byAirport,
                              value: 'byAirport'
                            },
                            {
                              label: t.whereFrom.whereFromToggle.byMembers,
                              value: 'byMembers'
                            }
                          ]
                        : [
                            {
                              label: t.whereFrom.whereFromToggle.byAddress,
                              value: 'byAddress'
                            },
                            {
                              label: t.whereFrom.whereFromToggle.byAirport,
                              value: 'byAirport'
                            }
                          ]
                      : user
                      ? [
                          {
                            label: t.whereFrom.whereFromToggle.byAddress,
                            value: 'byAddress'
                          },
                          {
                            label: t.whereFrom.whereFromToggle.byMembers,
                            value: 'byMembers'
                          },
                          {
                            label: t.whereFrom.whereFromToggle.byName,
                            value: 'byName'
                          },
                          {
                            label: t.whereFrom.whereFromToggle.byCompany,
                            value: 'byCompany'
                          }
                        ]
                      : [
                          {
                            label: t.whereFrom.whereFromToggle.byAddress,
                            value: 'byAddress'
                          },
                          {
                            label: t.whereFrom.whereFromToggle.byName,
                            value: 'byName'
                          },
                          {
                            label: t.whereFrom.whereFromToggle.byCompany,
                            value: 'byCompany'
                          }
                        ]
                  }
                />
              </S.ToggleWrapper>
            </S.Top>
            {state.quote.form.whereTo.toggle === 'byAddress' && (
              <S.Content>
                <GoogleAutoComplete
                  placeholder={t.whereTo.searchInput.byAddressPlaceholder}
                  onResult={(e) => {
                    handleGoogleAutoCompleteResult(e)
                    dispatch({ type: 'SET_WHERE_TO_STEP', value: 1 })
                  }}
                  label={t.whereTo.searchInput.byAddress}
                />
              </S.Content>
            )}
            {state.quote.form.whereTo.toggle === 'byName' && (
              <S.Content>
                <UserSearch
                  placeholder={t.whereTo.searchInput.byNamePlaceholder}
                  onChange={(value) => {
                    handleUserSearchResult(value)
                    dispatch({ type: 'SET_WHERE_TO_STEP', value: 1 })
                  }}
                  label={t.whereTo.searchInput.byName}
                />
              </S.Content>
            )}
            {state.quote.form.whereTo.toggle === 'byAirport' && (
              <S.Content>
                <AirportSearch
                  placeholder={t.whereFrom.searchInput.byAirportPlaceholder}
                  onChange={(value) => {
                    handleAirportSearchResult(value)
                  }}
                  label={t.whereFrom.searchInput.byAirport}
                />
              </S.Content>
            )}
            {state.quote.form.whereTo.toggle === 'byCompany' && (
              <S.Content>
                <CompanySearch
                  placeholder={t.whereTo.searchInput.byCompanyPlaceholder}
                  onChange={(value) => {
                    handleCompanySearchResult(value)
                    dispatch({ type: 'SET_WHERE_TO_STEP', value: 1 })
                  }}
                  label={t.whereTo.searchInput.byCompany}
                />
              </S.Content>
            )}
            {user && state.quote.form.whereTo.toggle === 'byMembers' && (
              <S.Content>
                <MembersSearch
                  placeholder={t.whereTo.searchInput.byMembersPlaceholder}
                  onChange={(value) => {
                    handleMembersSearchResult(value)
                    dispatch({ type: 'SET_WHERE_TO_STEP', value: 1 })
                  }}
                  label={t.whereTo.searchInput.byMembers}
                  owner={state.general.isCompanySelected ? 'company' : 'user'}
                />
              </S.Content>
            )}
          </S.PopUpWrapper>
        </>
      )}
      {state.quote.form.whereTo.step === 1 && (
        <>
          <S.BackContent>
            <S.BackIcon
              onClick={() => {
                dispatch({ type: 'SET_WHERE_TO_STEP', value: 0 })
              }}
              src="https://static.alirok.io/collections/icons/arrow-down.svg"
            />
            <S.FormTitle>Where to?</S.FormTitle>
          </S.BackContent>
          <S.FormWrapper>
            <S.Form onSubmit={handleSubmit(onSubmit)}>
              <S.Top>
                <S.BackContentDesk>
                  <S.BackIcon
                    onClick={() => {
                      dispatch({ type: 'SET_WHERE_TO_STEP', value: 0 })
                    }}
                    src="https://static.alirok.io/collections/icons/arrow-down.svg"
                  />
                </S.BackContentDesk>
                <S.ToggleWrapper width={isLandTab ? '285px' : '285px'}>
                  <Toggle
                    onChange={(e) => {
                      setValue('addressType', e.target.value as AddressType, {
                        shouldDirty: true
                      })
                    }}
                    checked={watch('addressType')}
                    disabled={
                      !!watch('userId') ||
                      !!watch('companyId') ||
                      !!watch('memberId')
                    }
                    name="addressType"
                    items={[
                      {
                        label: t.whereTo.addressType.residential,
                        value: 'residential'
                      },
                      {
                        label: t.whereTo.addressType.commercial,
                        value: 'commercial'
                      }
                    ]}
                  />
                </S.ToggleWrapper>
              </S.Top>
              <S.FormRow
                columns={'1fr 1fr 1fr 1fr'}
                gap="40px"
                mobileColumns="1fr 1fr"
              >
                <S.InputWrapper maxWidth="16.1rem" maxWidthMobile="100%">
                  <QuoteInput
                    width="100%"
                    error={errors.zipCode?.message}
                    label={t.whereTo.form.zipCode}
                    disabled={
                      !!watch('userId') ||
                      !!watch('companyId') ||
                      !!watch('memberId')
                    }
                    {...register('zipCode')}
                  />
                </S.InputWrapper>
                <S.InputWrapper maxWidth="15.8rem" maxWidthMobile="100%">
                  <QuoteInput
                    width="100%"
                    error={errors.country?.message}
                    label={t.whereTo.form.country}
                    disabled={
                      !!watch('userId') ||
                      !!watch('companyId') ||
                      !!watch('memberId')
                    }
                    {...register('country')}
                  />
                </S.InputWrapper>
                <S.InputWrapper maxWidth="16.5 rem" maxWidthMobile="100%">
                  <QuoteInput
                    width="100%"
                    error={errors.state?.message}
                    label={t.whereTo.form.state}
                    disabled={
                      !!watch('userId') ||
                      !!watch('companyId') ||
                      !!watch('memberId')
                    }
                    {...register('state')}
                  />
                </S.InputWrapper>
                <S.InputWrapper maxWidth="16.5rem" maxWidthMobile="100%">
                  <QuoteInput
                    width="100%"
                    error={errors.city?.message}
                    label={t.whereTo.form.city}
                    disabled={
                      !!watch('userId') ||
                      !!watch('companyId') ||
                      !!watch('memberId')
                    }
                    {...register('city')}
                  />
                </S.InputWrapper>
              </S.FormRow>
              <S.FormRow columns={'1fr 1fr'} gap="40px">
                <S.InputWrapper maxWidth="100%" maxWidthMobile="100%">
                  <QuoteInput
                    width="100%"
                    error={errors.street?.message}
                    label={t.whereTo.form.street}
                    maxLength={35}
                    disabled={
                      !!watch('userId') ||
                      !!watch('companyId') ||
                      !!watch('memberId')
                    }
                    {...register('street')}
                  />
                </S.InputWrapper>
                <S.FormRow
                  columns={'1fr 1fr'}
                  gap="40px"
                  mobileColumns="1fr 1fr"
                >
                  <S.InputWrapper maxWidth="15.8rem" maxWidthMobile="100%">
                    <QuoteInput
                      width="100%"
                      error={errors.streetNumber?.message}
                      label={t.whereTo.form.streetNumber}
                      disabled={
                        !!watch('userId') ||
                        !!watch('companyId') ||
                        !!watch('memberId')
                      }
                      {...register('streetNumber')}
                    />
                  </S.InputWrapper>
                  <S.InputWrapper maxWidth="16.1rem" maxWidthMobile="100%">
                    <QuoteInput
                      width="100%"
                      label={t.whereTo.form.additionalAddress}
                      maxLength={5}
                      {...register('additionalAddress')}
                    />
                  </S.InputWrapper>
                </S.FormRow>
              </S.FormRow>
              <S.FormRow columns="60% 1fr" gap="40px">
                <S.InputWrapper maxWidth="100%" maxWidthMobile="100%">
                  <QuoteInput
                    width="100%"
                    label={t.whereTo.form.complementAddress}
                    maxLength={35}
                    {...register('complementAddress')}
                  />
                </S.InputWrapper>
                <S.ButtonWrapper>
                  <Button width="full">
                    <S.ButtonText>{t.whereTo.confirmButton}</S.ButtonText>
                  </Button>
                </S.ButtonWrapper>
              </S.FormRow>
            </S.Form>
          </S.FormWrapper>
        </>
      )}
    </S.Container>
  )
}
