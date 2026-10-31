import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEnum,
  IsBoolean,
  IsInt
} from 'class-validator';
import { Type } from 'class-transformer';
import { AdminRole } from '../../../database/entities/admin.entity';

export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  jobTitle?: string;

  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  districtId?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
