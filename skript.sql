-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema eatery_db
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema eatery_db
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `eatery_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `eatery_db` ;

-- -----------------------------------------------------
-- Table `eatery_db`.`slika`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `eatery_db`.`slika` (
  `id_slike` BIGINT NOT NULL AUTO_INCREMENT,
  `datum_uploadovanja` DATETIME(6) NULL DEFAULT NULL,
  `naziv` VARCHAR(255) NOT NULL,
  `sadrzaj` LONGBLOB NULL DEFAULT NULL,
  `status` VARCHAR(50) NULL DEFAULT NULL,
  `velicina` BIGINT NULL DEFAULT NULL,
  PRIMARY KEY (`id_slike`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `eatery_db`.`korisnik`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `eatery_db`.`korisnik` (
  `id_korisnika` BIGINT NOT NULL AUTO_INCREMENT,
  `aktiviran` BIT(1) NULL DEFAULT NULL,
  `email` VARCHAR(255) NOT NULL,
  `korisnicko_ime` VARCHAR(255) NOT NULL,
  `sifra` VARCHAR(255) NOT NULL,
  `uloga` VARCHAR(50) NOT NULL,
  `id_slike` BIGINT NULL DEFAULT NULL,
  PRIMARY KEY (`id_korisnika`),
  UNIQUE INDEX `UK87tbhltaua2a6k6jrdfl1kqap` (`email` ASC) VISIBLE,
  UNIQUE INDEX `UKg77s6vv0ql6kiqdqk084f3fxi` (`korisnicko_ime` ASC) VISIBLE,
  INDEX `FK4sd1yrl9eawyoq26yj1svjuks` (`id_slike` ASC) VISIBLE,
  CONSTRAINT `FK4sd1yrl9eawyoq26yj1svjuks`
    FOREIGN KEY (`id_slike`)
    REFERENCES `eatery_db`.`slika` (`id_slike`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `eatery_db`.`administrator`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `eatery_db`.`administrator` (
  `id_korisnika` BIGINT NOT NULL,
  PRIMARY KEY (`id_korisnika`),
  CONSTRAINT `FKe6jxl8jjnwmjxqnjt68eblfss`
    FOREIGN KEY (`id_korisnika`)
    REFERENCES `eatery_db`.`korisnik` (`id_korisnika`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `eatery_db`.`kategorija`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `eatery_db`.`kategorija` (
  `id_kategorije` BIGINT NOT NULL AUTO_INCREMENT,
  `naziv` VARCHAR(255) NOT NULL,
  `id_korisnika` BIGINT NOT NULL,
  PRIMARY KEY (`id_kategorije`),
  INDEX `FKarmnukiycl00ht34nu7h64g6q` (`id_korisnika` ASC) VISIBLE,
  CONSTRAINT `FKarmnukiycl00ht34nu7h64g6q`
    FOREIGN KEY (`id_korisnika`)
    REFERENCES `eatery_db`.`korisnik` (`id_korisnika`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `eatery_db`.`jelo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `eatery_db`.`jelo` (
  `id_jela` BIGINT NOT NULL AUTO_INCREMENT,
  `cijena` DECIMAL(38,2) NOT NULL,
  `naziv` VARCHAR(255) NOT NULL,
  `opis` VARCHAR(255) NULL DEFAULT NULL,
  `id_kategorije` BIGINT NOT NULL,
  `id_korisnika` BIGINT NOT NULL,
  PRIMARY KEY (`id_jela`),
  INDEX `FKsyrylx8nc8nryih8sh02aalu3` (`id_kategorije` ASC) VISIBLE,
  INDEX `FKj0b8vmvw9yfnh16lacqgr4nd1` (`id_korisnika` ASC) VISIBLE,
  CONSTRAINT `FKj0b8vmvw9yfnh16lacqgr4nd1`
    FOREIGN KEY (`id_korisnika`)
    REFERENCES `eatery_db`.`korisnik` (`id_korisnika`),
  CONSTRAINT `FKsyrylx8nc8nryih8sh02aalu3`
    FOREIGN KEY (`id_kategorije`)
    REFERENCES `eatery_db`.`kategorija` (`id_kategorije`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `eatery_db`.`opis`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `eatery_db`.`opis` (
  `id_opisa` BIGINT NOT NULL AUTO_INCREMENT,
  `poslednja_izmjena` DATETIME(6) NULL DEFAULT NULL,
  `sadrzaj` TEXT NULL DEFAULT NULL,
  `tip` VARCHAR(50) NULL DEFAULT NULL,
  PRIMARY KEY (`id_opisa`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `eatery_db`.`klijent`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `eatery_db`.`klijent` (
  `naziv_objekta` VARCHAR(255) NOT NULL,
  `id_korisnika` BIGINT NOT NULL,
  `id_opisa` BIGINT NULL DEFAULT NULL,
  PRIMARY KEY (`id_korisnika`),
  INDEX `FKr4pfmle3njssf7k54tc6330pl` (`id_opisa` ASC) VISIBLE,
  CONSTRAINT `FK7jw3o4181ddltamey4d7eovt2`
    FOREIGN KEY (`id_korisnika`)
    REFERENCES `eatery_db`.`korisnik` (`id_korisnika`),
  CONSTRAINT `FKr4pfmle3njssf7k54tc6330pl`
    FOREIGN KEY (`id_opisa`)
    REFERENCES `eatery_db`.`opis` (`id_opisa`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `eatery_db`.`kupac`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `eatery_db`.`kupac` (
  `cesti_kupac` BIT(1) NULL DEFAULT NULL,
  `ime` VARCHAR(100) NOT NULL,
  `popust` INT NULL DEFAULT NULL,
  `suspendovan` BIT(1) NULL DEFAULT NULL,
  `id_korisnika` BIGINT NOT NULL,
  PRIMARY KEY (`id_korisnika`),
  CONSTRAINT `FKxb1t01dgll4ffwbuosbyc1ml`
    FOREIGN KEY (`id_korisnika`)
    REFERENCES `eatery_db`.`korisnik` (`id_korisnika`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `eatery_db`.`narudzba`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `eatery_db`.`narudzba` (
  `id_narudzbe` BIGINT NOT NULL AUTO_INCREMENT,
  `adresa_dostave` VARCHAR(255) NULL DEFAULT NULL,
  `id_klijenta` INT NULL DEFAULT NULL,
  `id_ponude` INT NULL DEFAULT NULL,
  `sifra` VARCHAR(45) NOT NULL,
  `status` VARCHAR(255) NULL DEFAULT NULL,
  `ukupna_cijena` DECIMAL(38,2) NULL DEFAULT NULL,
  `vrijeme_i_datum` DATETIME(6) NULL DEFAULT NULL,
  `id_kupca` BIGINT NOT NULL,
  `id_restorana` BIGINT NOT NULL,
  PRIMARY KEY (`id_narudzbe`),
  INDEX `FK60prxwxee4skqiftc5basfv51` (`id_kupca` ASC) VISIBLE,
  INDEX `FKegwh52jf1w63jr3shbkg21m89` (`id_restorana` ASC) VISIBLE,
  CONSTRAINT `FK60prxwxee4skqiftc5basfv51`
    FOREIGN KEY (`id_kupca`)
    REFERENCES `eatery_db`.`korisnik` (`id_korisnika`),
  CONSTRAINT `FKegwh52jf1w63jr3shbkg21m89`
    FOREIGN KEY (`id_restorana`)
    REFERENCES `eatery_db`.`korisnik` (`id_korisnika`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `eatery_db`.`ponuda`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `eatery_db`.`ponuda` (
  `id_ponude` BIGINT NOT NULL AUTO_INCREMENT,
  `cijena` DOUBLE NOT NULL,
  `kategorija` VARCHAR(50) NULL DEFAULT NULL,
  `naziv_jela` VARCHAR(100) NULL DEFAULT NULL,
  `tip_ponude` VARCHAR(50) NOT NULL,
  `id_klijenta` BIGINT NOT NULL,
  `id_opisa` BIGINT NULL DEFAULT NULL,
  `id_slike` BIGINT NULL DEFAULT NULL,
  PRIMARY KEY (`id_ponude`),
  INDEX `FKhd6hrtt6jewby3qkeyqve7w59` (`id_klijenta` ASC) VISIBLE,
  INDEX `FK7jihy2t65a0k4nst3ak7twenc` (`id_opisa` ASC) VISIBLE,
  INDEX `FKp7qfw7a0vuhi2fbnef4xuyd0w` (`id_slike` ASC) VISIBLE,
  CONSTRAINT `FK7jihy2t65a0k4nst3ak7twenc`
    FOREIGN KEY (`id_opisa`)
    REFERENCES `eatery_db`.`opis` (`id_opisa`),
  CONSTRAINT `FKhd6hrtt6jewby3qkeyqve7w59`
    FOREIGN KEY (`id_klijenta`)
    REFERENCES `eatery_db`.`klijent` (`id_korisnika`),
  CONSTRAINT `FKp7qfw7a0vuhi2fbnef4xuyd0w`
    FOREIGN KEY (`id_slike`)
    REFERENCES `eatery_db`.`slika` (`id_slike`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `eatery_db`.`stavka_narudzbe`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `eatery_db`.`stavka_narudzbe` (
  `id_stavke` BIGINT NOT NULL AUTO_INCREMENT,
  `cijena` DECIMAL(38,2) NULL DEFAULT NULL,
  `id_jela` BIGINT NULL DEFAULT NULL,
  `id_narudzbe` BIGINT NULL DEFAULT NULL,
  `kolicina` INT NULL DEFAULT NULL,
  `naziv` VARCHAR(255) NULL DEFAULT NULL,
  `tip_stavke` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id_stavke`),
  INDEX `FKne2m34iwfnf6fqx0y53x982cc` (`id_narudzbe` ASC) VISIBLE,
  CONSTRAINT `FKne2m34iwfnf6fqx0y53x982cc`
    FOREIGN KEY (`id_narudzbe`)
    REFERENCES `eatery_db`.`narudzba` (`id_narudzbe`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `eatery_db`.`vrecica_iznenadjenja`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `eatery_db`.`vrecica_iznenadjenja` (
  `id_vrecice` BIGINT NOT NULL AUTO_INCREMENT,
  `akcijska_cijena` DECIMAL(38,2) NOT NULL,
  `aktivna` BIT(1) NOT NULL,
  `kolicina` INT NOT NULL,
  `naziv` VARCHAR(255) NOT NULL,
  `opis` VARCHAR(500) NULL DEFAULT NULL,
  `originalna_cijena` DECIMAL(38,2) NOT NULL,
  `vrijeme_kreiranja` DATETIME(6) NULL DEFAULT NULL,
  `vrijeme_preuzimanja_do` VARCHAR(255) NULL DEFAULT NULL,
  `vrijeme_preuzimanja_od` VARCHAR(255) NULL DEFAULT NULL,
  `id_restorana` BIGINT NOT NULL,
  PRIMARY KEY (`id_vrecice`),
  INDEX `FKb680vb7e10x45qwf35fsccdle` (`id_restorana` ASC) VISIBLE,
  CONSTRAINT `FKb680vb7e10x45qwf35fsccdle`
    FOREIGN KEY (`id_restorana`)
    REFERENCES `eatery_db`.`korisnik` (`id_korisnika`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `eatery_db`.`zahtjev_za_aktivaciju`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `eatery_db`.`zahtjev_za_aktivaciju` (
  `id_zahtjeva` BIGINT NOT NULL AUTO_INCREMENT,
  `vrijeme_kreiranja` DATETIME(6) NULL DEFAULT NULL,
  `id_korisnika` BIGINT NOT NULL,
  PRIMARY KEY (`id_zahtjeva`),
  UNIQUE INDEX `UKce2laavw38xxcnx154wx467no` (`id_korisnika` ASC) VISIBLE,
  CONSTRAINT `FKg64i7x67q3b3gkshnarbmwvju`
    FOREIGN KEY (`id_korisnika`)
    REFERENCES `eatery_db`.`korisnik` (`id_korisnika`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
