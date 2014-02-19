#ifndef N_BUILT_IN_IMAGE_IMPORTER_H
#define N_BUILT_IN_IMAGE_IMPORTER_H

#include <QDialog>
#include <QTreeWidgetItem>

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
    QHash<QWidget *, QString> mImageWidgetToSrcPath;
    QHash<QWidget *, QString> mImageWidgetToDstPath;

private:
    void setupImageWidget();

private slots:
    void importImage(QTreeWidgetItem *item);
};

#endif // N_BUILT_IN_IMAGE_IMPORTER_H
