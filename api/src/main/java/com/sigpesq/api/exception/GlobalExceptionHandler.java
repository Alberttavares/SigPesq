package com.sigpesq.api.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Captura falhas das anotações (@NotBlank, @Pattern, @Positive, @AssertTrue, etc.)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> tratarErrosValidacao(MethodArgumentNotValidException ex) {
        Map<String, String> erros = new LinkedHashMap<>();

      ex.getBindingResult().getFieldErrors().forEach(erro ->
                erros.putIfAbsent(erro.getField(), erro.getDefaultMessage())
        );
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(erros);
    }

    // Captura erros de formato no JSON (ex: data inválida como "2026-99-99" ou texto em campo numérico)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> tratarJsonInvalido(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest()
                .body(Map.of("erro", "Formato de JSON inválido ou tipo de dado incompatível (verifique datas YYYY-MM-DD e números)."));
    }
}