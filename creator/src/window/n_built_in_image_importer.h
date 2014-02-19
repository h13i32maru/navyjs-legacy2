#ifndef N_BUILT_IN_IMAGE_IMPORTER_H
#define N_BUILT_IN_IMAGE_IMPORTER_H

#include <QDialog>

namespace Ui {
class NBuiltInImageImporter;
}

class NBuiltInImageImporter : public QDialog
{
    Q_OBJECT

public:
    explicit NBuiltInImageImporter(QWidget *parent = 0);
    ~NBuiltInImageImporter();

private:
    Ui::NBuiltInImageImporter *ui;
};

#endif // N_BUILT_IN_IMAGE_IMPORTER_H
