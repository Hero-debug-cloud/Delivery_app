import 'package:flutter_test/flutter_test.dart';
import 'package:client_app/main.dart';

void main() {
  testWidgets('App launches successfully smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const LogiRouteApp());

    // Verify that the login screen elements (e.g. title text) are found.
    expect(find.text('LogiRoute Driver'), findsOneWidget);
  });
}
