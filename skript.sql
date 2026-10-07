CREATE TABLE IF NOT EXISTS `eatery_db`.`recenzija` (
  `id_recenzije` BIGINT NOT NULL AUTO_INCREMENT,
  `ocjena` INT NOT NULL,                         
  `komentar` VARCHAR(1000) NULL DEFAULT NULL,       
  `datum_kreiranja` DATETIME(6) NOT NULL,
  `id_kupca` BIGINT NOT NULL,                      
  `id_restorana` BIGINT NOT NULL,                  
  `id_narudzbe` BIGINT NOT NULL,                   
  PRIMARY KEY (`id_recenzije`),
  UNIQUE INDEX `UK_recenzija_narudzba` (`id_narudzbe` ASC) VISIBLE, -- Jedna narudžba = jedna recenzija
  INDEX `FK_recenzija_kupac` (`id_kupca` ASC) VISIBLE,
  INDEX `FK_recenzija_restoran` (`id_restorana` ASC) VISIBLE,
  CONSTRAINT `FK_recenzija_kupac`
    FOREIGN KEY (`id_kupca`)
    REFERENCES `eatery_db`.`korisnik` (`id_korisnika`),
  CONSTRAINT `FK_recenzija_restoran`
    FOREIGN KEY (`id_restorana`)
    REFERENCES `eatery_db`.`korisnik` (`id_korisnika`),
  CONSTRAINT `FK_recenzija_narudzba`
    FOREIGN KEY (`id_narudzbe`)
    REFERENCES `eatery_db`.`narudzba` (`id_narudzbe`)
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;