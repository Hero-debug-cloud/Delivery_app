import '../../domain/models/customer_address.dart';

abstract class AddressState {
  const AddressState();
}

class AddressInitial extends AddressState {
  const AddressInitial();
}

class AddressLoading extends AddressState {
  const AddressLoading();
}

class AddressLoaded extends AddressState {
  final List<CustomerAddress> addresses;
  const AddressLoaded({required this.addresses});
}

class AddressActionSuccess extends AddressState {
  final String message;
  const AddressActionSuccess({required this.message});
}

class AddressError extends AddressState {
  final String message;
  const AddressError({required this.message});
}
