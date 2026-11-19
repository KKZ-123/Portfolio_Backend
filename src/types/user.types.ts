export interface User {
  id?: string;
  userid: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  userid?: string;
  password?: string;
  name: string;
  email: string;
  role?: string;
}

export interface UpdateUserDto {
  password: string;
}

export interface LoginUserDto {
  userid: string;
  password: string;
}

export interface UserAuthRow {
  name: string;
  email: string;
  userid: string;
  password?: string;
  role: string;
}

export interface UserAuthResponse {
  name: string;
  email: string;
  userid: string;
  role: string;
  access_token: string;
  refresh_token: string;
}

export interface RetokenDto {
  userid?: string;
  access_token?: string;
  refresh_token: string;
}

export interface RetokenResponse {
  userid: string;
  access_token: string;
}
