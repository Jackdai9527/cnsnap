export type AccountAddress = {
  id: string;
  firstName: string;
  lastName: string;
  country: string;
  state: string;
  city: string;
  address1: string;
  address2?: string;
  postcode: string;
  phone: string;
  email: string;
  isDefault: boolean;
  supported?: boolean;
};

export type AccountAddressFormValues = Omit<AccountAddress, "id">;
