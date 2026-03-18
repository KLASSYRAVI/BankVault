import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BcryptTool {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        System.out.println("Admin@123: " + encoder.encode("Admin@123"));
        System.out.println("Customer@123: " + encoder.encode("Customer@123"));
    }
}
