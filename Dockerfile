FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy settings.xml if you have custom mirrors (optional)
COPY pom.xml .

# Download dependencies with retry (Maven Central sometimes returns 403)
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -ntp -DskipTests dependency:resolve dependency:resolve-plugins || \
    (sleep 5 && mvn -B -ntp -DskipTests dependency:resolve dependency:resolve-plugins)

COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -ntp -DskipTests package

# Boot jar'ı seçmek için: plain varsa ele
RUN ls -lah target && \
    JAR=$(ls -1 target/*.jar | grep -vE '(-plain\.jar)$' | head -n 1) && \
    echo "Selected jar: $JAR" && \
    cp "$JAR" /app/app.jar

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/app.jar /app/app.jar
EXPOSE 9090
ENTRYPOINT ["java","-jar","/app/app.jar"]
