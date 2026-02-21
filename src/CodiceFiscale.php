<?php
class CodiceFiscale {
    private $comuni;
    
    private $mesi = [
        1 => 'A', 2 => 'B', 3 => 'C', 4 => 'D', 5 => 'E', 6 => 'H',
        7 => 'L', 8 => 'M', 9 => 'P', 10 => 'R', 11 => 'S', 12 => 'T'
    ];
    
    private $dispari = [
        '0' => 1, '1' => 0, '2' => 5, '3' => 7, '4' => 9, '5' => 13,
        '6' => 15, '7' => 17, '8' => 19, '9' => 21,
        'A' => 1, 'B' => 0, 'C' => 5, 'D' => 7, 'E' => 9, 'F' => 13,
        'G' => 15, 'H' => 17, 'I' => 19, 'J' => 21, 'K' => 2, 'L' => 4,
        'M' => 18, 'N' => 20, 'O' => 11, 'P' => 3, 'Q' => 6, 'R' => 8,
        'S' => 12, 'T' => 14, 'U' => 16, 'V' => 10, 'W' => 22, 'X' => 25,
        'Y' => 24, 'Z' => 23
    ];
    
    private $pari = [
        '0' => 0, '1' => 1, '2' => 2, '3' => 3, '4' => 4, '5' => 5,
        '6' => 6, '7' => 7, '8' => 8, '9' => 9,
        'A' => 0, 'B' => 1, 'C' => 2, 'D' => 3, 'E' => 4, 'F' => 5,
        'G' => 6, 'H' => 7, 'I' => 8, 'J' => 9, 'K' => 10, 'L' => 11,
        'M' => 12, 'N' => 13, 'O' => 14, 'P' => 15, 'Q' => 16, 'R' => 17,
        'S' => 18, 'T' => 19, 'U' => 20, 'V' => 21, 'W' => 22, 'X' => 23,
        'Y' => 24, 'Z' => 25
    ];
    
    public function __construct() {
        $this->comuni = require __DIR__ . '/comuni.php';
    }
    
    public function calcola($cognome, $nome, $data_nascita, $sesso, $comune) {
        $cognome = $this->normalizza($cognome);
        $nome = $this->normalizza($nome);
        $sesso = strtoupper(trim($sesso));
        
        if (!in_array($sesso, ['M', 'F'])) {
            throw new Exception('Il sesso deve essere M o F.');
        }
        
        $parts = null;
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $data_nascita, $parts)) {
            $anno = (int)$parts[1];
            $mese = (int)$parts[2];
            $giorno = (int)$parts[3];
        } elseif (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $data_nascita, $parts)) {
            $giorno = (int)$parts[1];
            $mese = (int)$parts[2];
            $anno = (int)$parts[3];
        } else {
            throw new Exception('Formato data non valido. Usa DD/MM/YYYY o YYYY-MM-DD.');
        }
        
        if ($mese < 1 || $mese > 12 || $giorno < 1 || $giorno > 31) {
            throw new Exception('Data di nascita non valida.');
        }
        
        $codice_comune = $this->trovaCodiceComune($comune);
        if (!$codice_comune) {
            throw new Exception('Comune non trovato: ' . $comune);
        }
        
        $cf = '';
        $cf .= $this->calcolaCognome($cognome);
        $cf .= $this->calcolaNome($nome);
        $cf .= $this->calcolaAnno($anno);
        $cf .= $this->calcolaMese($mese);
        $cf .= $this->calcolaGiorno($giorno, $sesso);
        $cf .= $codice_comune;
        $cf .= $this->calcolaChecksum($cf);
        
        return $cf;
    }
    
    private function normalizza($str) {
        $str = mb_strtoupper(trim($str), 'UTF-8');
        $accenti = ['À'=>'A','Á'=>'A','Â'=>'A','Ã'=>'A','Ä'=>'A','Å'=>'A',
                     'È'=>'E','É'=>'E','Ê'=>'E','Ë'=>'E',
                     'Ì'=>'I','Í'=>'I','Î'=>'I','Ï'=>'I',
                     'Ò'=>'O','Ó'=>'O','Ô'=>'O','Õ'=>'O','Ö'=>'O',
                     'Ù'=>'U','Ú'=>'U','Û'=>'U','Ü'=>'U',
                     'Ñ'=>'N','Ç'=>'C'];
        $str = strtr($str, $accenti);
        $str = preg_replace('/[^A-Z]/', '', $str);
        return $str;
    }
    
    private function estraiConsonanti($str) {
        return preg_replace('/[AEIOU]/', '', $str);
    }
    
    private function estraiVocali($str) {
        return preg_replace('/[^AEIOU]/', '', $str);
    }
    
    private function calcolaCognome($cognome) {
        $consonanti = $this->estraiConsonanti($cognome);
        $vocali = $this->estraiVocali($cognome);
        $lettere = $consonanti . $vocali;
        $lettere = str_pad($lettere, 3, 'X');
        return substr($lettere, 0, 3);
    }
    
    private function calcolaNome($nome) {
        $consonanti = $this->estraiConsonanti($nome);
        if (strlen($consonanti) >= 4) {
            return $consonanti[0] . $consonanti[2] . $consonanti[3];
        }
        $vocali = $this->estraiVocali($nome);
        $lettere = $consonanti . $vocali;
        $lettere = str_pad($lettere, 3, 'X');
        return substr($lettere, 0, 3);
    }
    
    private function calcolaAnno($anno) {
        return str_pad($anno % 100, 2, '0', STR_PAD_LEFT);
    }
    
    private function calcolaMese($mese) {
        return $this->mesi[$mese];
    }
    
    private function calcolaGiorno($giorno, $sesso) {
        if ($sesso === 'F') {
            $giorno += 40;
        }
        return str_pad($giorno, 2, '0', STR_PAD_LEFT);
    }
    
    private function trovaCodiceComune($comune) {
        $comune = mb_strtoupper(trim($comune), 'UTF-8');
        foreach ($this->comuni as $nome => $codice) {
            if (mb_strtoupper($nome, 'UTF-8') === $comune) {
                return $codice;
            }
        }
        foreach ($this->comuni as $nome => $codice) {
            if (strpos(mb_strtoupper($nome, 'UTF-8'), $comune) === 0) {
                return $codice;
            }
        }
        return null;
    }
    
    private function calcolaChecksum($codice) {
        $somma = 0;
        for ($i = 0; $i < 15; $i++) {
            $char = $codice[$i];
            if (($i + 1) % 2 !== 0) {
                $somma += $this->dispari[$char];
            } else {
                $somma += $this->pari[$char];
            }
        }
        $resto = $somma % 26;
        return chr(65 + $resto);
    }
    
    public function cercaComune($query) {
        $query = mb_strtoupper(trim($query), 'UTF-8');
        $results = [];
        $count = 0;
        foreach ($this->comuni as $nome => $codice) {
            if (strpos(mb_strtoupper($nome, 'UTF-8'), $query) !== false) {
                $results[] = ['nome' => $nome, 'codice' => $codice];
                $count++;
                if ($count >= 20) break;
            }
        }
        return $results;
    }
}
