import { IsString, IsEmail, MinLength, IsNotEmpty, Length, IsDateString } from 'class-validator';

export class CreatePlayerDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  countryCode: string; // ISO code (ex: "GB", "CA", "IN")

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string; // Format ISO: "2000-05-20"
}
