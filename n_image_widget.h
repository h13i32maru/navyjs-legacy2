#ifndef N_IMAGE_WIDGET_H
#define N_IMAGE_WIDGET_H

#include "n_file_tab_editor.h"

namespace Ui {
class NImageWidget;
}

class NImageWidget : public NFileTabEditor
{
    Q_OBJECT

public:
    explicit NImageWidget(QWidget *parent = 0);
    ~NImageWidget();

private:
    Ui::NImageWidget *ui;

protected:
    virtual QWidget *createTabWidget(const QString &filePath);
    virtual QString editedFileContent(QWidget *widget);
};

#endif // N_IMAGE_WIDGET_H
