import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsInt,
  Matches
} from 'class-validator';
import { Type } from 'class-transformer';
import { AdminRole } from '../../../database/entities/admin.entity';

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-z0-9_]+$/, { message: 'username may only contain lowercase letters, numbers, and underscores' })
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  jobTitle?: string;

  @IsEnum(AdminRole)
  role!: AdminRole;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  districtId?: number | null;
}
