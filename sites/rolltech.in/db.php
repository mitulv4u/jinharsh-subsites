<?php
$host = 'localhost';
$db = 'sql_rolltech_in';
$user = 'sql_rolltech_in';
$pass = 'dmjzLJ7NrLJXnxeC';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::ATTR_TIMEOUT => 3, // Don't hang for >3s if DB is unavailable
];

$pdo = null;
$db_available = false;

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    $db_available = true;
}
catch (\PDOException $e) {
    // DB unavailable - site will serve static content gracefully
    // Do NOT throw - that would crash the PHP worker
    $db_available = false;
}
?>
