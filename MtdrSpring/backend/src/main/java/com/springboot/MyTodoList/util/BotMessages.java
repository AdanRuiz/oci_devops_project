package com.springboot.MyTodoList.util;

public enum BotMessages {
	
	WELCOME(
	"Hola! Soy MyTodoList Bot!\n Ingrese alguno de los comandos disponibles: \n /register - para validar el usuario \n /addtask - para agregar una tarea a la lista (formato: /addtask \"<titulo>\" | \"<descripcion>\" | <horas esperadas> | <prioridad (LOW, MEDIUM, HIGH)> | <es bug (true/false)> | <ID de Usuario>) \n /deletetask - para eliminar una tarea (formato: /deletetask <ID o titulo>) \n /assigntask - para asignar una tarea a un sprint \n /completetask - para marcar una tarea como completada \n /mytasks - para ver todas las tareas"),
	USER_OK("Usuario reconocido, bienvenido"),
	USER_NOT_FOUND("Usuario no encontrado."),

	TASK_CREATED("Tarea creada exitosamente!"),
	TASK_ERROR("Error al crear la tarea. Asegúrate de usar el formato correcto: /addtask \"<titulo>\" | \"<descripcion>\" | <horas esperadas> | <prioridad (LOW, MEDIUM, HIGH)> | <es bug (true/false)> | <ID de Usuario>"),
	TASK_MAX_HOURS("Las horas no pueden exceder 4. Por favor subdivide esta tarea en tareas más pequeñas."),

	TASK_ASSIGNED("Tarea asignada al sprint exitosamente!"),
	TASK_ASSIGN_ERROR("Error al asignar la tarea. Asegúrate de usar el formato correcto: /assigntask <Numero de tarea> | <Numero de sprint>"),

	TASK_COMPLETED("Tarea marcada como completada!"),
	TASK_COMPLETE_ERROR("Error al completar la tarea. Asegúrate de usar el formato correcto: /completetask <Numero de tarea> | <horas> "),

	TASK_DELETED("Tarea eliminada exitosamente!"),
	TASK_DELETE_ERROR("Error al eliminar la tarea. Asegúrate de que la tarea existe."),

	TASK_NOT_FOUND("Tarea no encontrada."),

	TASK_LIST_HEADER("Tus tareas:"),
	
	MANAGER_ONLY("Este comando solo está disponible para gerentes."),
	REGISTER_FIRST("Debes registrarte primero usando /register para acceder a este comando."),
	
	TEAM_KPIS_HEADER("KPIs del desarrollador:"),
	DEVELOPER_NOT_IN_TEAM("El desarrollador no está en tu equipo."),
	
	TEAM_TASKS_HEADER("Tareas de tu equipo:"),
	TEAM_TASKS_EMPTY("Tu equipo no tiene tareas asignadas."),

	UNKNOWN_COMMAND("Comando desconocido. Por favor, ingresa un comando válido."),

	LLM_RESPONSE("Respuesta de la IA: ");

	private String message;

	BotMessages(String enumMessage) {
		this.message = enumMessage;
	}

	public String getMessage() {
		return message;
	}

}
