#ifndef N_CODE_WIDGET_H
#define N_CODE_WIDGET_H

#include "n_file_widget.h"

#include <QTextEdit>

namespace Ui {
class NCodeWidget;
}

class NCodeWidget : public NFileWidget
{
    Q_OBJECT

public:
    explicit NCodeWidget(const QDir &projectDir, const QString &filePath, QWidget *parent = 0);
    ~NCodeWidget();

protected:
    virtual bool innerSave();

private:
    Ui::NCodeWidget *ui;
    QTextEdit *mTextEdit;
};

#endif // N_CODE_WIDGET_H
